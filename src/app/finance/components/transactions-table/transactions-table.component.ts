import { Component, computed, inject, input, output, signal } from '@angular/core';

import { DeleteConfirmationDialogComponent } from '@app/finance/components/delete-confirmation-dialog/delete-confirmation-dialog.component';
import { FinanceService } from '@app/core/services/finance.service';
import { Transaction } from '@app/shared/models/transaction.model';

/**
 * Tabela de lançamentos filtrados pelo mês.
 * Recebe a lista via `input()` e delega mutações ao FinanceService.
 */
@Component({
  selector: 'app-transactions-table',
  standalone: true,
  imports: [DeleteConfirmationDialogComponent],
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

  /** Termo digitado no campo de busca do dashboard. */
  readonly termoBusca = this.finance.termoBusca;

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

  listContainerClass(): string {
    const base = 'mt-4 overflow-x-auto';
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
