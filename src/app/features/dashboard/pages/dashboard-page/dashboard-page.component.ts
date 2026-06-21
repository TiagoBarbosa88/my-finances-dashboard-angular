import { Component, computed, inject, signal } from '@angular/core';

import { FinanceService } from '@app/core/services/finance.service';
import { Transaction } from '@app/shared/models/transaction.model';
import { AllTransactionsModalComponent } from '@app/finance/components/all-transactions-modal/all-transactions-modal.component';
import { CategoryChartComponent } from '@app/finance/components/category-chart/category-chart.component';
import { NewTransactionDialogComponent } from '@app/finance/components/new-transaction-dialog/new-transaction-dialog.component';
import {
  SummaryCardComponent,
  SummaryCardIcon,
  SummaryCardVariant,
} from '@app/finance/components/summary-card/summary-card.component';
import { TransactionsTableComponent } from '@app/finance/components/transactions-table/transactions-table.component';

interface SummaryCardData {
  label:     string;
  value:     string;
  change:    string;
  positive:  boolean;
  variant:   SummaryCardVariant;
  valueTone: SummaryCardVariant | null;
  icon:      SummaryCardIcon;
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
    const receitas  = this.finance.totalReceitas();
    const despesas  = this.finance.totalDespesas();
    const pendentes = this.finance.totalPendentes();
    const saldo     = this.finance.saldoDisponivel();

    return [
      {
        label:     'Receitas',
        value:     this.finance.formatCurrency(receitas),
        change:    'entradas do mês',
        positive:  true,
        variant:   'green',
        valueTone: null,
        icon:      'trending-up',
      },
      {
        label:     'Despesas',
        value:     this.finance.formatCurrency(despesas),
        change:    'saídas do mês',
        positive:  false,
        variant:   'red',
        valueTone: null,
        icon:      'trending-down',
      },
      {
        label:     'Pendentes',
        value:     this.finance.formatCurrency(pendentes),
        change:    pendentes === 0 ? 'nenhum pendente' : 'aguardando pagamento',
        positive:  pendentes === 0,
        variant:   'amber',
        valueTone: null,
        icon:      'clock',
      },
      {
        label:     'Saldo Disponível',
        value:     this.finance.formatCurrency(saldo),
        change:    saldo > 0 ? 'positivo no mês' : saldo < 0 ? 'negativo no mês' : 'saldo zerado',
        positive:  saldo > 0,
        variant:   'neutral',
        valueTone: saldo > 0 ? 'green' : saldo < 0 ? 'red' : 'amber',
        icon:      'wallet',
      },
    ];
  });
}
