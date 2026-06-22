import { Component, computed, inject, signal } from '@angular/core';

import { AuthService } from '@app/core/services/auth.service';
import { FinanceService } from '@app/core/services/finance.service';
import { HasRoleDirective } from '@app/shared/directives/has-role.directive';
import { InvestimentosMetasComponent } from '@app/finance/components/investimentos-metas/investimentos-metas.component';
import { DistribuicaoAtivosBarrasComponent } from '@app/finance/components/distribuicao-ativos-barras/distribuicao-ativos-barras.component';
import { DistribuicaoClasseChartComponent } from '@app/finance/components/distribuicao-classe-chart/distribuicao-classe-chart.component';
import { MeusAtivosTableComponent } from '@app/finance/components/meus-ativos-table/meus-ativos-table.component';
import { NewInvestmentDialogComponent } from '@app/finance/components/new-investment-dialog/new-investment-dialog.component';
import {
  SummaryCardComponent,
  SummaryCardIcon,
  SummaryCardVariant,
} from '@app/finance/components/summary-card/summary-card.component';
import { Ativo, Investimento } from '@app/shared/models/investimentos.model';
import { formatCurrencyBRL, formatPercentBR } from '@app/shared/pipes/format.utils';

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
  selector: 'app-investimentos-page',
  standalone: true,
  imports: [
    SummaryCardComponent,
    InvestimentosMetasComponent,
    DistribuicaoAtivosBarrasComponent,
    DistribuicaoClasseChartComponent,
    MeusAtivosTableComponent,
    NewInvestmentDialogComponent,
    HasRoleDirective,
  ],
  templateUrl: './investimentos-page.component.html',
})
export class InvestimentosPageComponent {
  readonly finance = inject(FinanceService);
  readonly auth = inject(AuthService);

  readonly showDialog = signal(false);
  readonly editingInvestimento = signal<Investimento | null>(null);
  readonly editingAtivo = signal<Ativo | null>(null);

  readonly summaryCards = computed<SummaryCardData[]>(() => {
    const r = this.finance.investimentosResumo();
    const yieldOnCost = r.aportesTotal > 0
      ? (r.proventos12m / r.aportesTotal) * 100
      : 0;

    return [
      {
        label:     'Patrimônio Total',
        value:     formatCurrencyBRL(r.patrimonioTotal),
        change:    formatPercentBR(r.variacaoPct),
        positive:  r.variacaoPct >= 0,
        variant:   'neutral',
        valueTone: r.variacaoPct >= 0 ? 'green' : 'red',
        icon:      'wallet',
      },
      {
        label:     'Valor Investido',
        value:     formatCurrencyBRL(r.aportesTotal),
        change:    '',
        positive:  true,
        variant:   'neutral',
        valueTone: null,
        icon:      'coins',
      },
      {
        label:     'Lucro Total',
        value:     formatCurrencyBRL(r.lucroTotal),
        change:    formatPercentBR(r.rentabilidadeTotal),
        positive:  r.rentabilidadeTotal >= 0,
        variant:   'green',
        valueTone: null,
        icon:      'trending-up',
      },
      {
        label:     'Proventos (12M)',
        value:     formatCurrencyBRL(r.proventos12m),
        change:    formatPercentBR(yieldOnCost),
        positive:  yieldOnCost >= 0,
        variant:   'amber',
        valueTone: null,
        icon:      'percent',
      },
    ];
  });

  getSaudacao(): string {
    const hour = new Date().getHours();
    const periodo =
      hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';

    return `${periodo}, Tiago 👋`;
  }

  atualizarCotacoes(): void {
    this.finance.refreshCarteiraQuotes();
  }

  openNewInvestment(): void {
    this.editingInvestimento.set(null);
    this.editingAtivo.set(null);
    this.showDialog.set(true);
  }

  openEditAtivo(ativo: Ativo): void {
    this.editingInvestimento.set(null);
    this.editingAtivo.set(ativo);
    this.showDialog.set(true);
  }

  closeInvestmentDialog(): void {
    this.showDialog.set(false);
    this.editingInvestimento.set(null);
    this.editingAtivo.set(null);
  }
}
