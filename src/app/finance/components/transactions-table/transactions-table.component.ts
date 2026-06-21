import { Component, inject, input, output } from '@angular/core';

import { FinanceService } from '@app/core/services/finance.service';
import { Transaction } from '@app/shared/models/transaction.model';

/**
 * Tabela de lançamentos filtrados pelo mês.
 * Recebe a lista via `input()` e delega mutações ao FinanceService.
 */
@Component({
  selector: 'app-transactions-table',
  standalone: true,
  templateUrl: './transactions-table.component.html',
})
export class TransactionsTableComponent {
  /** Lista já filtrada — passada pelo dashboard via `finance.filteredTransactions()`. */
  transactions = input.required<Transaction[]>();

  /** Título exibido no cabeçalho da seção. */
  title = input('Últimos lançamentos');

  /** Exibe o link "Ver todos" no cabeçalho. */
  showViewAll = input(true);

  /** Exibe a coluna de ações (editar / excluir). */
  showActions = input(true);

  /** Emitido ao clicar em "Ver todos". */
  viewAll = output<void>();

  /** Emitido ao clicar em editar. */
  edit = output<Transaction>();

  readonly finance = inject(FinanceService);

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

  confirmDelete(transaction: Transaction): void {
    if (!confirm(`Excluir o lançamento "${transaction.descricao}"?`)) return;
    this.finance.deleteTransaction(transaction.id);
  }
}
