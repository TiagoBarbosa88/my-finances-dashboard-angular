import { Component, computed, inject, input, output, signal } from '@angular/core';

import { isReceitaCategory } from '@features/dashboard/data/finance.data';
import { AuthService } from '@core/auth/services/auth.service';
import { ConfirmDialogComponent } from '@shared/ui/confirm-dialog/confirm-dialog.component';
import { FinanceService } from '@core/api/finance.service';
import { Transaction } from '@shared/models/transaction.model';

export type SortColumn = 'data' | 'descricao' | 'categoria' | 'status' | 'criado_por' | 'valor';
export type SortDirection = 'asc' | 'desc';

const SORT_COLUMNS: { key: SortColumn; label: string }[] = [
  { key: 'data', label: 'Data' },
  { key: 'descricao', label: 'Descrição' },
  { key: 'categoria', label: 'Categoria' },
  { key: 'status', label: 'Status' },
  { key: 'criado_por', label: 'Quem lançou' },
  { key: 'valor', label: 'Valor' },
];

/**
 * Tabela de lançamentos filtrados pelo mês.
 * Recebe a lista via `input()` e delega mutações ao FinanceService.
 */
@Component({
  selector: 'app-transactions-table',
  standalone: true,
  imports: [ConfirmDialogComponent],
  templateUrl: './transactions-table.component.html',
})
export class TransactionsTableComponent {
  /** Lista já filtrada — passada pelo dashboard via `finance.filteredTransactions()`. */
  transactions = input.required<Transaction[]>();

  /** Título exibido no cabeçalho da seção. */
  title = input('Últimos lançamentos');

  /** Exibe o link "Ver todos" abaixo da lista (dashboard) ou no cabeçalho. */
  showViewAll = input(true);

  /** Limita altura da tabela com scroll vertical (usado no dashboard). */
  scrollableList = input(false);

  /** Exibe a coluna de ações (editar / excluir). */
  showActions = input(true);

  /** Emitido ao clicar em "Ver todos". */
  viewAll = output<void>();

  /** Emitido ao clicar em editar. */
  edit = output<Transaction>();

  /** Lançamento aguardando confirmação de exclusão. */
  readonly pendingDelete = signal<Transaction | null>(null);

  readonly finance = inject(FinanceService);
  readonly auth = inject(AuthService);

  /** Termo digitado no campo de busca do dashboard. */
  readonly termoBusca = this.finance.termoBusca;

  readonly sortColumn = signal<SortColumn>('data');
  readonly sortDirection = signal<SortDirection>('desc');
  readonly sortOptions = SORT_COLUMNS;

  /** Lista do mês filtrada pelo termo de busca (case-insensitive). */
  readonly transactionsFiltradas = computed(() => {
    const term = this.termoBusca().trim().toLowerCase();
    const list = this.transactions();

    if (!term) return list;

    return list.filter(
      (t) =>
        t.descricao.toLowerCase().includes(term) ||
        t.categoria.toLowerCase().includes(term) ||
        t.criado_por.toLowerCase().includes(term) ||
        t.status.toLowerCase().includes(term) ||
        String(t.valor).includes(term),
    );
  });

  readonly transactionsOrdenadas = computed(() => {
    const list = [...this.transactionsFiltradas()];
    const col = this.sortColumn();
    const dir = this.sortDirection();
    const factor = dir === 'asc' ? 1 : -1;

    list.sort((a, b) => {
      let cmp = 0;

      switch (col) {
        case 'data':
          cmp = a.data.localeCompare(b.data);
          break;
        case 'valor':
          cmp = a.valor - b.valor;
          break;
        case 'status':
          cmp = (a.status === 'pago' ? 0 : 1) - (b.status === 'pago' ? 0 : 1);
          break;
        case 'descricao':
          cmp = a.descricao.localeCompare(b.descricao, 'pt-BR');
          break;
        case 'categoria':
          cmp = a.categoria.localeCompare(b.categoria, 'pt-BR');
          break;
        case 'criado_por':
          cmp = a.criado_por.localeCompare(b.criado_por, 'pt-BR');
          break;
      }

      return cmp * factor;
    });

    return list;
  });

  toggleSort(column: SortColumn): void {
    if (this.sortColumn() === column) {
      this.sortDirection.update((d) => (d === 'asc' ? 'desc' : 'asc'));
      return;
    }

    this.sortColumn.set(column);
    this.sortDirection.set(column === 'data' || column === 'valor' ? 'desc' : 'asc');
  }

  toggleSortDirection(): void {
    this.sortDirection.update((d) => (d === 'asc' ? 'desc' : 'asc'));
  }

  onMobileSortChange(value: string): void {
    const column = value as SortColumn;
    if (!SORT_COLUMNS.some((c) => c.key === column)) return;
    this.sortColumn.set(column);
  }

  sortIcon(column: SortColumn): string {
    if (this.sortColumn() !== column) return '↕';
    return this.sortDirection() === 'asc' ? '↑' : '↓';
  }

  sortAriaLabel(column: SortColumn, label: string): string {
    if (this.sortColumn() !== column) return `Ordenar por ${label}`;
    const dir = this.sortDirection() === 'asc' ? 'crescente' : 'decrescente';
    return `${label}, ordenado ${dir}. Clique para inverter.`;
  }

  thSortClass(column: SortColumn): string {
    const base =
      'cursor-pointer select-none pb-3 font-medium transition-colors hover:text-foreground';
    return this.sortColumn() === column ? `${base} text-foreground` : base;
  }

  categoryBadgeStyle(categoria: string): Record<string, string> {
    const c = this.finance.getCategoryColor(categoria);
    return {
      borderColor: `color-mix(in oklab, ${c} 40%, transparent)`,
      color:        c,
      background:  `color-mix(in oklab, ${c} 12%, transparent)`,
    };
  }

  categoryDotStyle(categoria: string): Record<string, string> {
    return { background: this.finance.getCategoryColor(categoria) };
  }

  openDeleteDialog(transaction: Transaction): void {
    if (!this.auth.canDelete(transaction)) return;
    this.pendingDelete.set(transaction);
  }

  confirmDelete(): void {
    const transaction = this.pendingDelete();
    if (!transaction) return;

    this.finance.deleteTransaction(transaction.id);
    this.pendingDelete.set(null);
  }

  cancelDelete(): void {
    this.pendingDelete.set(null);
  }

  showActionsColumn(): boolean {
    return this.showActions() && this.auth.canCreate();
  }

  canModify(transaction: Transaction): boolean {
    return this.auth.canModify(transaction);
  }

  isReceita(transaction: Transaction): boolean {
    return isReceitaCategory(transaction.categoria);
  }

  categoryIconStyle(categoria: string): Record<string, string> {
    const color = this.finance.getCategoryColor(categoria);
    return {
      background: `color-mix(in oklab, ${color} 85%, black)`,
      color: '#fff',
    };
  }

  amountPrefix(transaction: Transaction): string {
    return this.isReceita(transaction) ? '+' : '−';
  }

  amountClass(transaction: Transaction): string {
    return this.isReceita(transaction) ? 'text-green-400' : 'text-red-400';
  }

  indicatorClass(transaction: Transaction): string {
    return this.isReceita(transaction) ? 'bg-green-500' : 'bg-red-500';
  }

  onMobileCardClick(transaction: Transaction): void {
    if (this.canModify(transaction)) {
      this.edit.emit(transaction);
    }
  }

  mobileListClass(): string {
    const base = 'mt-4 space-y-2 md:hidden';
    return this.scrollableList()
      ? `${base} max-h-[420px] overflow-y-auto scroll-elegant pr-0.5`
      : base;
  }

  listContainerClass(): string {
    const base = 'mt-4 hidden overflow-x-auto md:block';
    return this.scrollableList()
      ? `${base} max-h-[400px] overflow-y-auto scroll-elegant`
      : base;
  }

  theadClass(): string {
    return this.scrollableList()
      ? 'sticky top-0 z-10 bg-card/95 backdrop-blur-sm'
      : '';
  }
}
