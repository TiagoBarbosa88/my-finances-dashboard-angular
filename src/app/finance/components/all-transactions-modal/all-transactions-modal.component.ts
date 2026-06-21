import { Component, input, output } from '@angular/core';

import { TransactionsTableComponent } from '@app/finance/components/transactions-table/transactions-table.component';
import { Transaction } from '@app/shared/models/transaction.model';

/**
 * Modal com a lista completa de lançamentos do mês.
 * Reutiliza TransactionsTableComponent em largura total.
 */
@Component({
  selector: 'app-all-transactions-modal',
  standalone: true,
  imports: [TransactionsTableComponent],
  templateUrl: './all-transactions-modal.component.html',
})
export class AllTransactionsModalComponent {
  /** Emitido ao fechar (botão Fechar, × ou clique no backdrop). */
  close = output<void>();

  /** Repassado ao clicar em editar na tabela. */
  edit = output<Transaction>();

  /** Lançamentos filtrados pelo mês atual. */
  transactions = input.required<Transaction[]>();
}
