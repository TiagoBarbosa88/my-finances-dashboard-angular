import { DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import {
  Subject,
  debounceTime,
  distinctUntilChanged,
  of,
  switchMap,
  tap,
} from 'rxjs';

import { TIPOS_ATIVO_ORDEM } from '@features/investments/data/investimentos.data';
import { FinanceService } from '@core/api/finance.service';
import { StockService } from '@core/api/stock.service';
import { parseInvestimentosFile } from '@core/utils/investimentos-import.utils';
import { BrapiStockSearchResult } from '@shared/models/brapi.model';
import {
  Ativo,
  Investimento,
  InvestimentoDraft,
  OperacaoInvestimento,
  TipoAtivo,
} from '@shared/models/investimentos.model';
import { CurrencyBrlPipe } from '@shared/pipes/currency-brl.pipe';

@Component({
  selector: 'app-new-investment-dialog',
  standalone: true,
  imports: [FormsModule, DecimalPipe, CurrencyBrlPipe],
  templateUrl: './new-investment-dialog.component.html',
})
export class NewInvestmentDialogComponent {
  close = output<void>();

  investimento = input<Investimento | null>(null);
  ativo = input<Ativo | null>(null);

  private readonly finance = inject(FinanceService);
  private readonly stockService = inject(StockService);
  private readonly searchInput$ = new Subject<string>();

  readonly operacaoOptions: OperacaoInvestimento[] = ['compra', 'venda'];
  readonly tipoOptions = TIPOS_ATIVO_ORDEM;
  readonly acceptedFileTypes =
    '.xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv';

  readonly operacao       = signal<OperacaoInvestimento>('compra');
  readonly tipoAtivo      = signal<TipoAtivo>('Ações');
  readonly ticker         = signal('');
  readonly empresaNome    = signal('');
  readonly setorManual    = signal('');
  readonly dataTransacao  = signal(new Date().toISOString().split('T')[0]);
  readonly quantidade     = signal<number | null>(null);
  readonly preco          = signal<number | null>(null);
  readonly outrosCustos   = signal<number | null>(0);

  readonly searchQuery    = signal('');
  readonly searchResults  = signal<BrapiStockSearchResult[]>([]);
  readonly searchLoading  = signal(false);
  readonly showDropdown   = signal(false);
  readonly fetchingPreco  = signal(false);

  readonly investimentosPendentes = signal<InvestimentoDraft[]>([]);
  readonly importando             = signal(false);
  readonly importError            = signal<string | null>(null);
  readonly isDragOver             = signal(false);

  readonly isEditLancamento = computed(() => this.investimento() !== null);
  readonly isEditAtivo      = computed(() => this.ativo() !== null && this.investimento() === null);
  readonly isEditMode       = computed(() => this.isEditLancamento() || this.isEditAtivo());
  readonly modoImportacao   = computed(() => this.investimentosPendentes().length > 0);

  readonly jaPossuiAtivo = computed(() => {
    const symbol = this.ticker().trim().toUpperCase();
    if (!symbol) return false;

    return this.finance.carteiraAtivos().some(
      (a) => a.ticker.toUpperCase() === symbol,
    );
  });

  readonly setorSelecionado = computed(() => {
    const manual = this.setorManual().trim();
    if (manual) return manual;

    const match = this.finance.catalogoAtivos().find(
      (item) => item.ticker === this.ticker() && item.tipo === this.tipoAtivo(),
    );

    return match?.setor ?? '';
  });

  readonly valorTotal = computed(() =>
    this.finance.calcValorTotalInvestimento(
      this.quantidade() ?? 0,
      this.preco() ?? 0,
      this.outrosCustos() ?? 0,
    ),
  );

  readonly isFormValid = computed(() => {
    if (this.modoImportacao()) {
      return this.investimentosPendentes().length > 0 && !this.importando();
    }

    const qtd = this.quantidade() ?? 0;
    const precoUnit = this.preco() ?? 0;

    return (
      this.ticker().trim().length > 0 &&
      qtd > 0 &&
      precoUnit > 0 &&
      this.dataTransacao().length > 0 &&
      (this.outrosCustos() ?? 0) >= 0
    );
  });

  constructor() {
    this.searchInput$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap((query) => {
        if (query.trim().length < 3) {
          this.searchResults.set([]);
          this.searchLoading.set(false);
        }
      }),
      switchMap((query) => {
        const term = query.trim();
        if (term.length < 3) return of([]);

        this.searchLoading.set(true);
        return this.stockService.searchStock(term);
      }),
      takeUntilDestroyed(),
    ).subscribe((results) => {
      this.searchResults.set(results);
      this.searchLoading.set(false);
      if (results.length > 0) {
        this.showDropdown.set(true);
      }
    });

    effect(() => {
      const lancamento = this.investimento();
      const posicao = this.ativo();

      if (lancamento) {
        this.loadInvestimento(lancamento);
      } else if (posicao) {
        this.loadAtivo(posicao);
      } else {
        this.resetForm();
      }
    });
  }

  setOperacao(op: OperacaoInvestimento): void {
    this.operacao.set(op);
  }

  setTipoAtivo(tipo: TipoAtivo): void {
    this.tipoAtivo.set(tipo);
  }

  operacaoLabel(op: OperacaoInvestimento): string {
    return op === 'compra' ? 'Compra' : 'Venda';
  }

  onSearchInput(value: string): void {
    this.searchQuery.set(value);
    this.ticker.set('');
    this.empresaNome.set('');
    this.setorManual.set('');

    if (value.trim().length < 3) {
      this.searchResults.set([]);
      this.showDropdown.set(false);
      return;
    }

    this.showDropdown.set(true);
    this.searchInput$.next(value);
  }

  onSearchBlur(): void {
    setTimeout(() => this.showDropdown.set(false), 150);
  }

  selectStock(item: BrapiStockSearchResult): void {
    this.ticker.set(item.symbol);
    this.empresaNome.set(item.name);
    this.setorManual.set(item.sector);
    this.tipoAtivo.set(this.inferTipoAtivo(item.subType));
    this.searchQuery.set(`${item.symbol} — ${item.name}`);
    this.searchResults.set([]);
    this.showDropdown.set(false);

    if (item.price != null) {
      this.preco.set(item.price);
    }

    this.fetchPrecoAtual(item.symbol);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);

    const file = event.dataTransfer?.files?.[0];
    if (file) this.processFile(file);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.processFile(file);
    input.value = '';
  }

  removerPendente(index: number): void {
    this.investimentosPendentes.update((list) => list.filter((_, i) => i !== index));
  }

  limparImportacao(): void {
    this.investimentosPendentes.set([]);
    this.importError.set(null);
  }

  salvar(): void {
    if (!this.isFormValid()) return;

    if (this.modoImportacao()) {
      this.confirmarImportacao();
      return;
    }

    if (this.isEditLancamento()) {
      const editing = this.investimento()!;
      this.finance.updateInvestment(editing.id, this.buildPayload());
    } else if (this.isEditAtivo()) {
      const editing = this.ativo()!;
      this.finance.updateAtivo(editing.id, {
        ticker:     this.ticker().trim().toUpperCase(),
        tipo:       this.tipoAtivo(),
        setor:      this.setorSelecionado() || editing.setor,
        qtd:        this.quantidade()!,
        precoMedio: this.preco()!,
        precoAtual: this.preco()!,
      });
    } else {
      this.finance.addInvestment(this.buildPayload());
    }

    this.resetForm();
    this.close.emit();
  }

  private fetchPrecoAtual(symbol: string): void {
    this.fetchingPreco.set(true);

    this.stockService.fetchQuotes([symbol]).subscribe({
      next: (quotes) => {
        const price = quotes.get(symbol.toUpperCase());
        if (price != null) {
          this.preco.set(price);
        }
        this.fetchingPreco.set(false);
      },
      error: () => this.fetchingPreco.set(false),
    });
  }

  private inferTipoAtivo(subType: string): TipoAtivo {
    const value = subType.toLowerCase();

    if (value === 'etf') return 'ETFs';
    if (value === 'fii' || value === 'fi-infra' || value === 'fi-agro') return 'FIIs';

    return 'Ações';
  }

  private confirmarImportacao(): void {
    const drafts = this.investimentosPendentes();
    this.importando.set(true);
    this.importError.set(null);

    this.finance.importInvestmentsBatch(drafts).subscribe({
      next: () => {
        this.resetForm();
        this.close.emit();
      },
      error: () => {
        this.importError.set(
          'Não foi possível salvar. Tente novamente.',
        );
        this.importando.set(false);
      },
    });
  }

  private processFile(file: File): void {
    this.importError.set(null);
    this.importando.set(true);

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const buffer = reader.result as ArrayBuffer;
        const { drafts, errors } = parseInvestimentosFile(buffer);

        if (drafts.length === 0) {
          throw new Error(
            errors.length > 0
              ? errors.slice(0, 3).join(' ')
              : 'Nenhum lançamento válido encontrado no arquivo.',
          );
        }

        if (drafts.length === 1) {
          this.investimentosPendentes.set([]);
          this.preencherFormulario(drafts[0]);
        } else {
          this.investimentosPendentes.set(drafts);
          if (errors.length > 0) {
            this.importError.set(`${errors.length} linha(s) ignorada(s).`);
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao processar o arquivo.';
        this.importError.set(message);
      } finally {
        this.importando.set(false);
      }
    };

    reader.onerror = () => {
      this.importError.set('Falha ao ler o arquivo.');
      this.importando.set(false);
    };

    reader.readAsArrayBuffer(file);
  }

  private preencherFormulario(draft: InvestimentoDraft): void {
    this.operacao.set(draft.operacao);
    this.tipoAtivo.set(draft.tipo);
    this.ticker.set(draft.ticker);
    this.searchQuery.set(draft.ticker);
    this.empresaNome.set('');
    this.setorManual.set(draft.setor);
    this.dataTransacao.set(draft.data);
    this.quantidade.set(draft.quantidade);
    this.preco.set(draft.preco);
    this.outrosCustos.set(draft.outrosCustos);
  }

  private buildPayload(): InvestimentoDraft {
    return {
      operacao:     this.operacao(),
      tipo:         this.tipoAtivo(),
      ticker:       this.ticker().trim().toUpperCase(),
      setor:        this.setorSelecionado(),
      data:         this.dataTransacao(),
      quantidade:   this.quantidade()!,
      preco:        this.preco()!,
      outrosCustos: this.outrosCustos() ?? 0,
      criado_por:   this.investimento()?.criado_por ?? 'Você',
    };
  }

  private loadInvestimento(i: Investimento): void {
    this.limparImportacao();
    this.operacao.set(i.operacao);
    this.tipoAtivo.set(i.tipo);
    this.ticker.set(i.ticker);
    this.searchQuery.set(i.ticker);
    this.empresaNome.set('');
    this.setorManual.set(i.setor);
    this.dataTransacao.set(i.data);
    this.quantidade.set(i.quantidade);
    this.preco.set(i.preco);
    this.outrosCustos.set(i.outrosCustos);
  }

  private loadAtivo(a: Ativo): void {
    this.limparImportacao();
    this.operacao.set('compra');
    this.tipoAtivo.set(a.tipo);
    this.ticker.set(a.ticker);
    this.searchQuery.set(a.ticker);
    this.empresaNome.set('');
    this.setorManual.set(a.setor);
    this.dataTransacao.set(new Date().toISOString().split('T')[0]);
    this.quantidade.set(a.qtd);
    this.preco.set(a.precoAtual);
    this.outrosCustos.set(0);
  }

  private resetForm(): void {
    this.operacao.set('compra');
    this.tipoAtivo.set('Ações');
    this.ticker.set('');
    this.empresaNome.set('');
    this.setorManual.set('');
    this.searchQuery.set('');
    this.searchResults.set([]);
    this.showDropdown.set(false);
    this.searchLoading.set(false);
    this.fetchingPreco.set(false);
    this.dataTransacao.set(new Date().toISOString().split('T')[0]);
    this.quantidade.set(null);
    this.preco.set(null);
    this.outrosCustos.set(0);
    this.investimentosPendentes.set([]);
    this.importError.set(null);
    this.importando.set(false);
    this.isDragOver.set(false);
  }
}
