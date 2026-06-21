import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';

import {
  BAR_CATEGORIES,
  CATEGORY_GOALS,
  EXPENSE_CATEGORIES,
  INITIAL_TRANSACTIONS,
  PIE_COLORS,
  STATUS_STORAGE_KEY,
} from '@app/core/services/finance.data';
import { SupabaseService } from '@app/core/services/supabase.service';
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

  private readonly transactionsUrl = `${environment.apiUrl}/transactions`;

  // ─── Estado global ────────────────────────────────────────────────────────

  /** Lista de lançamentos — populada via JSON Server (`loadTransactions`). */
  readonly transactions = signal<Transaction[]>([]);

  /** Indica que uma operação assíncrona está em andamento. */
  readonly loading = signal(false);

  /** Mês/ano visível no dashboard. Inicia em junho/2026 (dados presentes). */
  readonly currentDate = signal(new Date(2026, 5, 1));

  constructor() {
    this.loadTransactions();
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

  readonly pieData = computed<PieChartItem[]>(() => {
    const list = this.filteredTransactions();
    return EXPENSE_CATEGORIES.map((cat) => ({
      name:  cat,
      value: list.filter((t) => t.categoria === cat).reduce((s, t) => s + t.valor, 0),
      color: PIE_COLORS[cat],
    })).filter((item) => item.value > 0);
  });

  readonly pieTotal = computed(() => this.pieData().reduce((s, i) => s + i.value, 0));

  readonly barData = computed<BarChartItem[]>(() => {
    const list = this.filteredTransactions();
    return BAR_CATEGORIES.map((c) => ({
      cat:   c.label,
      gasto: list.filter((t) => t.categoria === c.key).reduce((s, t) => s + t.valor, 0),
      meta:  CATEGORY_GOALS[c.key] ?? 0,
    }));
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
    const entries = this.buildTransactionEntries(transaction, recorrencia);

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

    this.transactions.update((list) =>
      list.map((t) => (t.id === id ? { ...t, ...transaction } : t)),
    );
    this.persistStatuses();

    if (!this.supabase.isConfigured()) return;

    this.supabase.updateTransaction(id, transaction).then((saved) => {
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
   * Remove um lançamento:
   *   1. Remoção otimista imediata.
   *   2. Persiste no Supabase em background (se configurado).
   *   3. Restaura em caso de erro de rede.
   */
  deleteTransaction(id: number): void {
    const previous = this.transactions().find((t) => t.id === id);
    if (!previous) return;

    this.transactions.update((list) => list.filter((t) => t.id !== id));
    this.persistStatuses();

    if (!this.supabase.isConfigured()) return;

    this.supabase.deleteTransaction(id).then((ok) => {
      if (!ok) {
        this.transactions.update((list) => [...list, previous]);
        this.persistStatuses();
      }
    });
  }

  /**
   * Alterna pago ↔ pendente:
   *   1. Atualização otimista imediata.
   *   2. Persiste no Supabase em background (se configurado).
   *   3. Reverte em caso de erro de rede.
   */
  toggleStatus(id: number): void {
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
    return PIE_COLORS[categoria] ?? 'var(--muted-foreground)';
  }

  statusLabel(status: TransactionStatus): string {
    return status === 'pago' ? 'Pago' : 'Pendente';
  }

  pctOfTotal(value: number): number {
    const total = this.stats().total;
    return total > 0 ? Math.round((value / total) * 100) : 0;
  }

  // ─── Carregamento ─────────────────────────────────────────────────────────

  /** Carrega lançamentos do JSON Server local (porta 3000). */
  loadTransactions(): void {
    this.loading.set(true);

    this.http.get<Transaction[]>(this.transactionsUrl).subscribe({
      next: (data) => {
        const saved = this.readSavedStatuses();
        this.transactions.set(
          data.map((t) => ({ ...t, status: saved[t.id] ?? t.status })),
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
    return INITIAL_TRANSACTIONS.map((t) => ({
      ...t,
      status: saved[t.id] ?? t.status,
    }));
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
