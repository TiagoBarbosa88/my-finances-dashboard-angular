import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { forkJoin, Observable, of, tap } from 'rxjs';

import {
  CATEGORIAS,
  CATEGORY_GOALS,
  CATEGORY_SHORT_LABELS,
  CHART_PALETTE,
  INITIAL_TRANSACTIONS,
  PIE_COLORS,
  resolveCategoryColor,
  STATUS_STORAGE_KEY,
} from '@app/core/services/finance.data';
import {
  CLASSE_ATIVO_CORES,
  CATALOGO_ATIVOS,
  INITIAL_ATIVOS,
  INITIAL_INVESTIMENTOS,
  INITIAL_TARGET_METAS,
  PROVENTOS_12M,
  PROVENTOS_ACUMULADOS,
  FATOR_AJUSTE_RENTABILIDADE_12M,
  TARGET_METAS_STORAGE_KEY,
  TIPOS_ATIVO_ORDEM,
} from '@app/core/services/investimentos.data';
import { SupabaseService } from '@app/core/services/supabase.service';
import { AuthService } from '@app/core/services/auth.service';
import { StockService } from '@app/core/services/stock.service';
import {
  Ativo,
  AtivoEnriquecido,
  GrupoAtivos,
  Investimento,
  InvestimentoDraft,
  InvestimentosResumo,
  RebalanceTipo,
  TargetMeta,
} from '@app/shared/models/investimentos.model';
import {
  BarChartItem,
  FinanceStats,
  PieChartItem,
  Transaction,
  TransactionRecurrence,
  TransactionStatus,
} from '@app/shared/models/transaction.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class FinanceService {
  private readonly http = inject(HttpClient);
  private readonly supabase = inject(SupabaseService);
  private readonly auth = inject(AuthService);
  private readonly stockService = inject(StockService);

  private readonly transactionsUrl = `${environment.apiUrl}/transactions`;
  private readonly investimentosUrl = `${environment.apiUrl}/investimentos`;
  private readonly ativosUrl = `${environment.apiUrl}/ativos`;

  // ─── Estado global ────────────────────────────────────────────────────────

  /** Lista de lançamentos — populada via JSON Server (`loadTransactions`). */
  readonly transactions = signal<Transaction[]>([]);

  /** Indica que uma operação assíncrona está em andamento. */
  readonly loading = signal(false);

  /** Mês/ano visível no dashboard. Inicia em junho/2026 (dados presentes). */
  readonly currentDate = signal(new Date(2026, 5, 1));

  /** Termo de busca compartilhado (header → tabela). */
  readonly termoBusca = signal('');

  /** Posições da carteira (ativos). */
  readonly carteiraAtivos = signal<Ativo[]>(INITIAL_ATIVOS);

  /** Lançamentos de compra/venda persistidos no JSON Server. */
  readonly investimentos = signal<Investimento[]>(INITIAL_INVESTIMENTOS);

  /** Indica busca de cotações na Brapi em andamento. */
  readonly quotesLoading = signal(false);

  /** Metas de alocação por classe (% da carteira). */
  readonly targetMetas = signal<TargetMeta[]>(FinanceService.loadTargetMetas());

  constructor() {
    this.loadTransactions();
    this.loadCarteiraAtivos();
    this.loadInvestimentos();
  }

  private static loadTargetMetas(): TargetMeta[] {
    try {
      const raw = localStorage.getItem(TARGET_METAS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as TargetMeta[];
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      /* fallback para defaults */
    }
    return INITIAL_TARGET_METAS.map((m) => ({ ...m }));
  }

  // ─── Derivados ────────────────────────────────────────────────────────────

  readonly filteredTransactions = computed(() => {
    const d = this.currentDate();
    return this.transactions().filter((t) => {
      const td = new Date(t.data);
      return td.getMonth() === d.getMonth() && td.getFullYear() === d.getFullYear();
    });
  });

  readonly monthLabel = computed(() => {
    const m = this.currentDate().toLocaleString('pt-BR', { month: 'long' });
    return m.charAt(0).toUpperCase() + m.slice(1);
  });

  readonly yearLabel = computed(() => this.currentDate().getFullYear());

  readonly stats = computed<FinanceStats>(() => {
    const list = this.filteredTransactions();
    const total    = list.reduce((s, t) => s + t.valor, 0);
    const pago     = list.filter((t) => t.status === 'pago').reduce((s, t) => s + t.valor, 0);
    const pendente = list.filter((t) => t.status === 'pendente').reduce((s, t) => s + t.valor, 0);
    return { total, pago, pendente };
  });

  readonly totalReceitas = computed(() =>
    this.filteredTransactions()
      .filter((t) => this.isReceita(t.categoria))
      .reduce((s, t) => s + t.valor, 0),
  );

  readonly totalDespesas = computed(() =>
    this.filteredTransactions()
      .filter((t) => !this.isReceita(t.categoria))
      .reduce((s, t) => s + t.valor, 0),
  );

  /** Soma das transações com status pendente no mês visível. */
  readonly totalPendentes = computed(() =>
    this.filteredTransactions()
      .filter((t) => t.status === 'pendente')
      .reduce((s, t) => s + t.valor, 0),
  );

  readonly saldoDisponivel = computed(
    () => this.totalReceitas() - this.totalDespesas(),
  );

  // ─── Investimentos ────────────────────────────────────────────────────────

  readonly patrimonioTotal = computed(() =>
    this.carteiraAtivos().reduce((s, a) => s + a.qtd * a.precoAtual, 0),
  );

  readonly aportesTotal = computed(() =>
    this.carteiraAtivos().reduce((s, a) => s + a.qtd * a.precoMedio, 0),
  );

  /** Ganho de capital = patrimônio atual − valor investido (aportes). */
  readonly ganhoCapital = computed(
    () => this.patrimonioTotal() - this.aportesTotal(),
  );

  /** Lucro total = ganho de capital + proventos acumulados. */
  readonly lucroTotal = computed(
    () => this.ganhoCapital() + PROVENTOS_ACUMULADOS,
  );

  readonly proventos12m = computed(() => PROVENTOS_12M);

  readonly proventosAcumulados = computed(() => PROVENTOS_ACUMULADOS);

  /**
   * Rentabilidade da carteira = variação patrimonial ajustada pelos proventos 12M.
   * Fórmula: (ganhoCapital − proventos12M / fator) / valorInvestido × 100
   */
  readonly rentabilidadeTotal = computed(() => {
    const aportes = this.aportesTotal();
    if (aportes <= 0) return 0;

    const fatorAjuste = FATOR_AJUSTE_RENTABILIDADE_12M;

    return (
      (this.ganhoCapital() - this.proventos12m() / fatorAjuste) / aportes
    ) * 100;
  });

  readonly variacaoPatrimonioPct = computed(() => {
    const aportes = this.aportesTotal();
    return aportes > 0 ? (this.ganhoCapital() / aportes) * 100 : 0;
  });

  readonly investimentosResumo = computed<InvestimentosResumo>(() => ({
    patrimonioTotal:      this.patrimonioTotal(),
    aportesTotal:         this.aportesTotal(),
    ganhoCapital:         this.ganhoCapital(),
    lucroTotal:           this.lucroTotal(),
    proventos12m:         this.proventos12m(),
    proventosAcumulados:  this.proventosAcumulados(),
    rentabilidadeTotal:   this.rentabilidadeTotal(),
    variacaoPct:          this.variacaoPatrimonioPct(),
  }));

  /** Rebalanceamento por classe — recalcula ao mudar metas ou carteira. */
  readonly rebalancePorTipo = computed<RebalanceTipo[]>(() => this.calculateRebalance());

  readonly rebalanceMap = computed(() => {
    const map = new Map<string, RebalanceTipo>();
    for (const item of this.rebalancePorTipo()) {
      map.set(item.tipo, item);
    }
    return map;
  });

  /**
   * Compara alocação atual vs meta: gap = (Patrimônio × Target%) − Valor atual do tipo.
   * Positivo indica déficit — falta aportar na classe.
   */
  calculateRebalance(): RebalanceTipo[] {
    const patrimonio = this.patrimonioTotal();
    const valorPorTipo = new Map<string, number>();

    for (const ativo of this.carteiraAtivos()) {
      const valor = ativo.qtd * ativo.precoAtual;
      valorPorTipo.set(ativo.tipo, (valorPorTipo.get(ativo.tipo) ?? 0) + valor);
    }

    return this.targetMetas().map((meta) => {
      const currentValue = valorPorTipo.get(meta.tipo) ?? 0;
      const targetValue = patrimonio * (meta.targetPercent / 100);
      const gap = targetValue - currentValue;
      const currentPercent = patrimonio > 0 ? (currentValue / patrimonio) * 100 : 0;

      return {
        tipo:           meta.tipo,
        targetPercent:  meta.targetPercent,
        currentPercent,
        currentValue,
        targetValue,
        gap,
        aporteSugerido: Math.max(0, gap),
        needsRebalance: gap > 0,
      };
    });
  }

  updateTargetMeta(tipo: string, targetPercent: number): void {
    const list = this.targetMetas();
    const othersSum = list
      .filter((m) => m.tipo !== tipo)
      .reduce((s, m) => s + m.targetPercent, 0);
    const maxAllowed = Math.max(0, 100 - othersSum);
    const clamped = Math.min(maxAllowed, Math.max(0, targetPercent));

    this.targetMetas.update((current) =>
      current.map((m) => (m.tipo === tipo ? { ...m, targetPercent: clamped } : m)),
    );

    try {
      localStorage.setItem(TARGET_METAS_STORAGE_KEY, JSON.stringify(this.targetMetas()));
    } catch {
      /* storage indisponível */
    }
  }

  /** Máximo que `tipo` pode receber sem ultrapassar 100% no total. */
  maxTargetFor(tipo: string): number {
    const othersSum = this.targetMetas()
      .filter((m) => m.tipo !== tipo)
      .reduce((s, m) => s + m.targetPercent, 0);
    return Math.max(0, 100 - othersSum);
  }

  readonly ativosEnriquecidos = computed<AtivoEnriquecido[]>(() => {
    const patrimonio = this.patrimonioTotal();
    const rebalanceMap = this.rebalanceMap();

    return this.carteiraAtivos().map((ativo) => {
      const valorTotal = ativo.qtd * ativo.precoAtual;
      const variacaoPct = ativo.precoMedio > 0
        ? ((ativo.precoAtual - ativo.precoMedio) / ativo.precoMedio) * 100
        : 0;
      const rentabilidadePct = ativo.rentabilidadePct ?? variacaoPct;
      const score = ativo.score ?? 5;
      const rebalance = rebalanceMap.get(ativo.tipo);
      const buyRecommendation = !!(rebalance?.needsRebalance && score >= 5);

      return {
        ...ativo,
        valorTotal,
        pctCarteira: patrimonio > 0 ? (valorTotal / patrimonio) * 100 : 0,
        variacaoPct,
        rentabilidadePct,
        score,
        buyRecommendation,
      };
    });
  });

  readonly ativosPorTipo = computed<GrupoAtivos[]>(() => {
    const porTipo = new Map<string, AtivoEnriquecido[]>();

    for (const ativo of this.ativosEnriquecidos()) {
      const lista = porTipo.get(ativo.tipo) ?? [];
      lista.push(ativo);
      porTipo.set(ativo.tipo, lista);
    }

    return TIPOS_ATIVO_ORDEM.map((tipo) => {
      const ativos = porTipo.get(tipo) ?? [];
      return {
        tipo,
        ativos,
        valorTotal: ativos.reduce((s, a) => s + a.valorTotal, 0),
      };
    });
  });

  readonly distribuicaoPorClasse = computed<PieChartItem[]>(() => {
    const patrimonio = this.patrimonioTotal();
    if (patrimonio <= 0) return [];

    return this.ativosPorTipo().map((grupo) => ({
      name:  grupo.tipo,
      value: (grupo.valorTotal / patrimonio) * 100,
      color: CLASSE_ATIVO_CORES[grupo.tipo],
    }));
  });

  readonly distribuicaoPatrimonio = computed(
    () => this.patrimonioTotal(),
  );

  /** Catálogo de tickers filtrável por tipo (select do modal). */
  readonly catalogoAtivos = computed(() => CATALOGO_ATIVOS);

  /** Valor total do lançamento = (qtd × preço) + outros custos. */
  calcValorTotalInvestimento(quantidade: number, preco: number, outrosCustos: number): number {
    return quantidade * preco + outrosCustos;
  }

  /** Monta payload completo a partir do rascunho. */
  buildInvestimentoPayload(draft: InvestimentoDraft): Omit<Investimento, 'id'> {
    return {
      ...draft,
      valorTotal: this.calcValorTotalInvestimento(draft.quantidade, draft.preco, draft.outrosCustos),
    };
  }

  addInvestment(investimento: InvestimentoDraft): void {
    const payload = this.buildInvestimentoPayload(investimento);

    this.http.post<Investimento>(this.investimentosUrl, payload).subscribe({
      next: (saved) => this.appendImportedInvestment(saved),
      error: (err) => {
        console.error('[FinanceService] addInvestment:', err);
        const saved: Investimento = {
          ...payload,
          id: this.nextInvestimentoId(),
        };
        this.appendImportedInvestment(saved);
      },
    });
  }

  /** Persiste lançamento importado ou criado via POST. */
  appendImportedInvestment(saved: Investimento): void {
    this.investimentos.update((list) => [...list, saved]);
    this.applyInvestimentoNaCarteira(saved);
  }

  /** POST em lote de rascunhos importados (CSV/Excel). */
  importInvestmentsBatch(drafts: InvestimentoDraft[]): Observable<Investimento[]> {
    if (drafts.length === 0) return of([]);

    const requests = drafts.map((draft) =>
      this.http.post<Investimento>(
        this.investimentosUrl,
        this.buildInvestimentoPayload(draft),
      ),
    );

    return forkJoin(requests).pipe(
      tap((saved) => saved.forEach((item) => this.appendImportedInvestment(item))),
    );
  }

  updateInvestment(id: number, investimento: InvestimentoDraft): void {
    const previous = this.investimentos().find((i) => i.id === id);
    if (!previous) return;

    const payload = this.buildInvestimentoPayload(investimento);

    this.investimentos.update((list) =>
      list.map((i) => (i.id === id ? { ...i, ...payload } : i)),
    );
    this.syncCarteiraComInvestimentos();

    this.http.put<Investimento>(`${this.investimentosUrl}/${id}`, payload).subscribe({
      next: (saved) => {
        this.investimentos.update((list) =>
          list.map((i) => (i.id === id ? saved : i)),
        );
        this.syncCarteiraComInvestimentos();
      },
      error: (err) => {
        console.error('[FinanceService] updateInvestment:', err);
        this.investimentos.update((list) =>
          list.map((i) => (i.id === id ? { ...previous } : i)),
        );
        this.syncCarteiraComInvestimentos();
      },
    });
  }

  deleteInvestment(id: number): void {
    const previous = this.investimentos();
    this.investimentos.update((list) => list.filter((i) => i.id !== id));
    this.syncCarteiraComInvestimentos();

    this.http.delete<void>(`${this.investimentosUrl}/${id}`).subscribe({
      next: () => this.syncCarteiraComInvestimentos(),
      error: (err) => {
        console.error('[FinanceService] deleteInvestment:', err);
        this.investimentos.set(previous);
        this.syncCarteiraComInvestimentos();
      },
    });
  }

  /** Atualiza posição existente na carteira (modo edição via ativo). */
  updateAtivo(id: number, ativo: Omit<Ativo, 'id'>): void {
    const previous = this.carteiraAtivos().find((a) => a.id === id);
    if (!previous) return;

    this.carteiraAtivos.update((list) =>
      list.map((a) => (a.id === id ? { ...a, ...ativo } : a)),
    );

    this.http.put<Ativo>(`${this.ativosUrl}/${id}`, { ...ativo, id }).subscribe({
      next: (saved) => {
        this.carteiraAtivos.update((list) =>
          list.map((a) => (a.id === id ? saved : a)),
        );
      },
      error: (err) => {
        console.error('[FinanceService] updateAtivo:', err);
        this.carteiraAtivos.update((list) =>
          list.map((a) => (a.id === id ? previous : a)),
        );
      },
    });
  }

  loadInvestimentos(): void {
    this.http.get<Investimento[]>(this.investimentosUrl).subscribe({
      next: (data) => this.investimentos.set(data),
      error: () => this.investimentos.set(INITIAL_INVESTIMENTOS),
    });
  }

  loadCarteiraAtivos(): void {
    this.http.get<Ativo[]>(this.ativosUrl).subscribe({
      next: (data) => {
        if (data.length > 0) {
          this.carteiraAtivos.set(data);
        }
      },
      error: () => this.carteiraAtivos.set(INITIAL_ATIVOS),
    });
  }

  /** Atualiza precoAtual in-memory com cotações da Brapi (não persiste no JSON). */
  refreshCarteiraQuotes(): void {
    const tickers = this.carteiraAtivos()
      .filter((a) => a.tipo !== 'Tesouro Direto')
      .map((a) => a.ticker.toUpperCase());

    const unique = [...new Set(tickers)];
    if (unique.length === 0) return;

    this.refreshMarketQuotes(unique);
  }

  private refreshMarketQuotes(tickers: string[]): void {
    this.quotesLoading.set(true);

    this.stockService.fetchQuotes(tickers).subscribe({
      next: (quotes) => {
        if (quotes.size > 0) {
          this.carteiraAtivos.update((list) =>
            list.map((ativo) => {
              const price = quotes.get(ativo.ticker.toUpperCase());
              return price != null ? { ...ativo, precoAtual: price } : ativo;
            }),
          );
        }
        this.quotesLoading.set(false);
      },
      error: () => this.quotesLoading.set(false),
    });
  }

  private nextInvestimentoId(): number {
    const ids = this.investimentos().map((i) => i.id);
    return ids.length > 0 ? Math.max(...ids) + 1 : 1;
  }

  private nextAtivoId(): number {
    const ids = this.carteiraAtivos().map((a) => a.id);
    return ids.length > 0 ? Math.max(...ids) + 1 : 1;
  }

  private applyInvestimentoNaCarteira(lancamento: Investimento): void {
    const key = `${lancamento.tipo}:${lancamento.ticker}`;
    const list = [...this.carteiraAtivos()];
    const index = list.findIndex((a) => `${a.tipo}:${a.ticker}` === key);

    if (lancamento.operacao === 'compra') {
      const custoTotal =
        lancamento.quantidade * lancamento.preco + lancamento.outrosCustos;

      if (index >= 0) {
        const atual = list[index];
        const novaQtd = atual.qtd + lancamento.quantidade;
        const novoPM = novaQtd > 0
          ? (atual.qtd * atual.precoMedio + custoTotal) / novaQtd
          : lancamento.preco;

        list[index] = {
          ...atual,
          qtd: novaQtd,
          precoMedio: novoPM,
          precoAtual: lancamento.preco,
          setor: lancamento.setor || atual.setor,
        };
      } else {
        list.push({
          id: this.nextAtivoId(),
          ticker: lancamento.ticker,
          tipo: lancamento.tipo,
          setor: lancamento.setor,
          qtd: lancamento.quantidade,
          precoMedio: lancamento.quantidade > 0
            ? custoTotal / lancamento.quantidade
            : lancamento.preco,
          precoAtual: lancamento.preco,
        });
      }
    } else {
      if (index < 0) return;

      const atual = list[index];
      const novaQtd = atual.qtd - lancamento.quantidade;

      if (novaQtd <= 0) {
        list.splice(index, 1);
      } else {
        list[index] = {
          ...atual,
          qtd: novaQtd,
          precoAtual: lancamento.preco,
        };
      }
    }

    this.carteiraAtivos.set(list);
    this.persistCarteiraAtivos(list);
  }

  private syncCarteiraComInvestimentos(): void {
    let carteira: Ativo[] = [];
    let nextId = 1;

    const sorted = [...this.investimentos()].sort(
      (a, b) => a.data.localeCompare(b.data) || a.id - b.id,
    );

    for (const lancamento of sorted) {
      carteira = this.applyLancamentoEmLista(carteira, lancamento, () => nextId++);
    }

    if (carteira.length === 0 && this.investimentos().length === 0) {
      carteira = [...INITIAL_ATIVOS];
    }

    this.carteiraAtivos.set(carteira);
    this.persistCarteiraAtivos(carteira);
  }

  private applyLancamentoEmLista(
    list: Ativo[],
    lancamento: Investimento,
    nextId: () => number,
  ): Ativo[] {
    const copy = [...list];
    const key = `${lancamento.tipo}:${lancamento.ticker}`;
    const index = copy.findIndex((a) => `${a.tipo}:${a.ticker}` === key);

    if (lancamento.operacao === 'compra') {
      const custoTotal =
        lancamento.quantidade * lancamento.preco + lancamento.outrosCustos;

      if (index >= 0) {
        const atual = copy[index];
        const novaQtd = atual.qtd + lancamento.quantidade;
        copy[index] = {
          ...atual,
          qtd: novaQtd,
          precoMedio: novaQtd > 0
            ? (atual.qtd * atual.precoMedio + custoTotal) / novaQtd
            : lancamento.preco,
          precoAtual: lancamento.preco,
          setor: lancamento.setor || atual.setor,
        };
      } else {
        copy.push({
          id: nextId(),
          ticker: lancamento.ticker,
          tipo: lancamento.tipo,
          setor: lancamento.setor,
          qtd: lancamento.quantidade,
          precoMedio: lancamento.quantidade > 0
            ? custoTotal / lancamento.quantidade
            : lancamento.preco,
          precoAtual: lancamento.preco,
        });
      }
    } else if (index >= 0) {
      const atual = copy[index];
      const novaQtd = atual.qtd - lancamento.quantidade;

      if (novaQtd <= 0) {
        copy.splice(index, 1);
      } else {
        copy[index] = { ...atual, qtd: novaQtd, precoAtual: lancamento.preco };
      }
    }

    return copy;
  }

  private persistCarteiraAtivos(ativos: Ativo[]): void {
    for (const ativo of ativos) {
      this.http.put<Ativo>(`${this.ativosUrl}/${ativo.id}`, ativo).subscribe({
        error: () => {
          this.http.post<Ativo>(this.ativosUrl, ativo).subscribe();
        },
      });
    }
  }

  readonly pieData = computed<PieChartItem[]>(() => {
    const totals = this.groupExpensesByCategory();

    return [...totals.entries()]
      .filter(([, value]) => value > 0)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value], index) => ({
        name,
        value,
        color: resolveCategoryColor(name, index),
      }));
  });

  readonly pieTotal = computed(() => this.pieData().reduce((s, i) => s + i.value, 0));

  readonly barData = computed<BarChartItem[]>(() => {
    const totals = this.groupExpensesByCategory();
    const categories = new Set([
      ...totals.keys(),
      ...Object.keys(CATEGORY_GOALS),
    ]);

    return [...categories]
      .map((key) => ({
        cat:   CATEGORY_SHORT_LABELS[key] ?? key,
        gasto: totals.get(key) ?? 0,
        meta:  CATEGORY_GOALS[key] ?? 0,
      }))
      .filter((item) => item.gasto > 0 || item.meta > 0)
      .sort((a, b) => b.gasto - a.gasto);
  });

  // ─── Ações ────────────────────────────────────────────────────────────────

  prevMonth(): void {
    const d = this.currentDate();
    this.currentDate.set(new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }

  nextMonth(): void {
    const d = this.currentDate();
    this.currentDate.set(new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  /**
   * Adiciona um ou mais lançamentos (recorrência mensal opcional).
   * Cada entrada é persistida via POST no JSON Server; o signal é atualizado
   * somente após resposta bem-sucedida.
   */
  addTransaction(
    transaction: Omit<Transaction, 'id'>,
    recorrencia?: TransactionRecurrence,
  ): void {
    if (!this.auth.canCreate()) {
      console.warn('[FinanceService] addTransaction: permissão negada.');
      return;
    }

    const owned = this.auth.stampOwnership(transaction);
    const entries = this.buildTransactionEntries(owned, recorrencia);

    entries.forEach((entry) => {
      this.http.post<Transaction>(this.transactionsUrl, entry).subscribe({
        next: (saved) => {
          this.transactions.update((list) => [...list, saved]);
          this.persistStatuses();
        },
        error: (err) => {
          console.error('[FinanceService] addTransaction:', err);
        },
      });
    });
  }

  private buildTransactionEntries(
    base: Omit<Transaction, 'id'>,
    recorrencia?: TransactionRecurrence,
  ): Omit<Transaction, 'id'>[] {
    if (!recorrencia?.recorrente || recorrencia.vezes < 2) {
      return [base];
    }

    const vezes = Math.min(12, Math.max(2, recorrencia.vezes));
    const [year, month, day] = base.data.split('-').map(Number);

    return Array.from({ length: vezes }, (_, index) => {
      const date = new Date(year, month - 1 + index, day);
      return { ...base, data: this.toISODate(date) };
    });
  }

  private toISODate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /**
   * Atualiza um lançamento existente:
   *   1. Atualização otimista imediata.
   *   2. Persiste no Supabase em background (se configurado).
   *   3. Reverte em caso de erro de rede.
   */
  updateTransaction(id: number, transaction: Omit<Transaction, 'id'>): void {
    const previous = this.transactions().find((t) => t.id === id);
    if (!previous) return;

    if (!this.auth.canModify(previous)) {
      console.warn('[FinanceService] updateTransaction: permissão negada.');
      return;
    }

    const payload = {
      ...transaction,
      user_id: previous.user_id,
      criado_por: previous.criado_por,
    };

    this.transactions.update((list) =>
      list.map((t) => (t.id === id ? { ...t, ...payload } : t)),
    );
    this.persistStatuses();

    if (!this.supabase.isConfigured()) return;

    this.supabase.updateTransaction(id, payload).then((saved) => {
      if (saved) {
        this.transactions.update((list) =>
          list.map((t) => (t.id === id ? saved : t)),
        );
        this.persistStatuses();
      } else {
        this.transactions.update((list) =>
          list.map((t) => (t.id === id ? previous : t)),
        );
        this.persistStatuses();
      }
    });
  }

  /**
   * Remove um lançamento via DELETE no JSON Server.
   * O signal é atualizado somente após resposta bem-sucedida.
   */
  deleteTransaction(id: number): void {
    const target = this.transactions().find((t) => t.id === id);
    if (!target) return;

    if (!this.auth.canDelete(target)) {
      console.warn('[FinanceService] deleteTransaction: permissão negada.');
      return;
    }

    this.http.delete<void>(`${this.transactionsUrl}/${id}`).subscribe({
      next: () => {
        this.transactions.update((list) => list.filter((t) => t.id !== id));
        this.persistStatuses();
      },
      error: (err) => {
        console.error('[FinanceService] deleteTransaction:', err);
      },
    });
  }

  /**
   * Alterna pago ↔ pendente:
   *   1. Atualização otimista imediata.
   *   2. Persiste no Supabase em background (se configurado).
   *   3. Reverte em caso de erro de rede.
   */
  toggleStatus(id: number): void {
    const target = this.transactions().find((t) => t.id === id);
    if (!target) return;

    if (!this.auth.canModify(target)) {
      console.warn('[FinanceService] toggleStatus: permissão negada.');
      return;
    }

    this.transactions.update((list) =>
      list.map((t) =>
        t.id === id
          ? { ...t, status: (t.status === 'pago' ? 'pendente' : 'pago') as TransactionStatus }
          : t,
      ),
    );
    this.persistStatuses();

    if (!this.supabase.isConfigured()) return;

    const newStatus = this.transactions().find((t) => t.id === id)?.status;
    if (!newStatus) return;

    this.supabase.updateTransactionStatus(id, newStatus).then((ok) => {
      if (!ok) {
        // Reverte o toggle em caso de falha
        this.transactions.update((list) =>
          list.map((t) =>
            t.id === id
              ? { ...t, status: (t.status === 'pago' ? 'pendente' : 'pago') as TransactionStatus }
              : t,
          ),
        );
        this.persistStatuses();
      }
    });
  }

  // ─── Utilitários de formatação ────────────────────────────────────────────

  formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  formatShortDate(data: string): string {
    return new Date(data + 'T12:00:00').toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    });
  }

  getCategoryColor(categoria: string): string {
    if (PIE_COLORS[categoria]) return PIE_COLORS[categoria];

    const idx = [...categoria].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return CHART_PALETTE[idx % CHART_PALETTE.length];
  }

  statusLabel(status: TransactionStatus): string {
    return status === 'pago' ? 'Pago' : 'Pendente';
  }

  pctOfTotal(value: number): number {
    const total = this.stats().total;
    return total > 0 ? Math.round((value / total) * 100) : 0;
  }

  private isReceita(categoria: string): boolean {
    return (CATEGORIAS.RECEITA as readonly string[]).includes(categoria);
  }

  /** Agrupa despesas do mês visível por categoria (exclui receitas como Salário). */
  private groupExpensesByCategory(): Map<string, number> {
    const totals = new Map<string, number>();

    for (const t of this.filteredTransactions()) {
      if (this.isReceita(t.categoria)) continue;
      totals.set(t.categoria, (totals.get(t.categoria) ?? 0) + t.valor);
    }

    return totals;
  }

  // ─── Carregamento ─────────────────────────────────────────────────────────

  /** Carrega lançamentos do JSON Server local (porta 3000). */
  loadTransactions(): void {
    this.loading.set(true);

    this.http.get<Transaction[]>(this.transactionsUrl).subscribe({
      next: (data) => {
        const saved = this.readSavedStatuses();
        this.transactions.set(
          data.map((t) => this.enrichTransaction({ ...t, status: saved[t.id] ?? t.status })),
        );
        this.loading.set(false);
      },
      error: (err) => {
        console.warn('[FinanceService] JSON Server indisponível — usando dados locais.', err);
        this.transactions.set(this.loadLocalTransactions());
        this.loading.set(false);
      },
    });
  }

  // ─── Persistência local (fallback offline) ────────────────────────────────

  private loadLocalTransactions(): Transaction[] {
    const saved = this.readSavedStatuses();
    return INITIAL_TRANSACTIONS.map((t) =>
      this.enrichTransaction({ ...t, status: saved[t.id] ?? t.status }),
    );
  }

  private enrichTransaction(transaction: Transaction): Transaction {
    if (transaction.user_id != null) return transaction;

    const userId = this.auth.resolveUserId(transaction.criado_por);
    return userId != null ? { ...transaction, user_id: userId } : transaction;
  }

  private readSavedStatuses(): Record<number, TransactionStatus> {
    if (typeof localStorage === 'undefined') return {};
    try {
      const raw = localStorage.getItem(STATUS_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Record<number, TransactionStatus>) : {};
    } catch {
      return {};
    }
  }

  private persistStatuses(): void {
    if (typeof localStorage === 'undefined') return;
    const map = this.transactions().reduce<Record<number, TransactionStatus>>((acc, t) => {
      acc[t.id] = t.status;
      return acc;
    }, {});
    localStorage.setItem(STATUS_STORAGE_KEY, JSON.stringify(map));
  }
}
