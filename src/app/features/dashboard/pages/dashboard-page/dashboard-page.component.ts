import { Component, computed, inject, signal } from '@angular/core';

import { FinanceService } from '@app/core/services/finance.service';
import { Transaction } from '@app/shared/models/transaction.model';
import { AllTransactionsModalComponent } from '@app/finance/components/all-transactions-modal/all-transactions-modal.component';
import { CategoryChartComponent } from '@app/finance/components/category-chart/category-chart.component';
import { NewTransactionDialogComponent } from '@app/finance/components/new-transaction-dialog/new-transaction-dialog.component';
import { SummaryCardComponent, SummaryCardIcon } from '@app/finance/components/summary-card/summary-card.component';
import { TransactionsTableComponent } from '@app/finance/components/transactions-table/transactions-table.component';

interface SummaryCardData {
  label:    string;
  value:    string;
  change:   string;
  positive: boolean;
  accent:   string;
  icon:     SummaryCardIcon;
}

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [
    SummaryCardComponent,
    CategoryChartComponent,
    TransactionsTableComponent,
    NewTransactionDialogComponent,
    AllTransactionsModalComponent,
  ],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.css',
})
export class DashboardPageComponent {
  readonly finance = inject(FinanceService);

  /** Controla a visibilidade do modal de novo lançamento. */
  readonly showDialog = signal(false);

  /** Transação em edição — `null` abre o modal em modo criação. */
  readonly editingTransaction = signal<Transaction | null>(null);

  /** Controla a visibilidade do modal de todos os lançamentos. */
  readonly showAllTransactions = signal(false);

  openAllTransactions(): void {
    this.showAllTransactions.set(true);
  }

  openNewTransaction(): void {
    this.editingTransaction.set(null);
    this.showDialog.set(true);
  }

  openEditTransaction(transaction: Transaction): void {
    this.editingTransaction.set(transaction);
    this.showDialog.set(true);
  }

  closeTransactionDialog(): void {
    this.showDialog.set(false);
    this.editingTransaction.set(null);
  }

  /** Saudação dinâmica conforme o horário do dia. */
  getSaudacao(): string {
    const hour = new Date().getHours();
    const periodo =
      hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

    return `${periodo}, Tiago 👋`;
  }

  readonly summaryCards = computed<SummaryCardData[]>(() => {
    const s    = this.finance.stats();
    const pPct = this.finance.pctOfTotal(s.pago);
    const nPct = this.finance.pctOfTotal(s.pendente);

    return [
      {
        label:    'Total do Mês',
        value:    this.finance.formatCurrency(s.total),
        change:   'todas as despesas',
        positive: false,
        accent:   'from-primary/30 to-primary/0',
        icon:     'wallet',
      },
      {
        label:    'Total Pago',
        value:    this.finance.formatCurrency(s.pago),
        change:   `${pPct}% do total`,
        positive: true,
        accent:   'from-chart-2/30 to-chart-2/0',
        icon:     'check',
      },
      {
        label:    'Total Pendente',
        value:    this.finance.formatCurrency(s.pendente),
        change:   `${nPct}% do total`,
        positive: nPct === 0,
        accent:   'from-destructive/25 to-destructive/0',
        icon:     'clock',
      },
    ];
  });
}
