import { DecimalPipe } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';

import { FinanceService } from '@app/core/services/finance.service';
import { AtivoEnriquecido, GrupoAtivos } from '@app/shared/models/investimentos.model';
import { CurrencyBrlPipe } from '@app/shared/pipes/currency-brl.pipe';
import { PercentBrPipe } from '@app/shared/pipes/percent-br.pipe';

/**
 * Tabela de ativos agrupados por tipo — componente burro (somente exibição).
 */
@Component({
  selector: 'app-meus-ativos-table',
  standalone: true,
  imports: [CurrencyBrlPipe, PercentBrPipe, DecimalPipe],
  templateUrl: './meus-ativos-table.component.html',
})
export class MeusAtivosTableComponent {
  private readonly finance = inject(FinanceService);

  grupos = input.required<GrupoAtivos[]>();
  showActions = input(true);

  edit = output<AtivoEnriquecido>();

  readonly quotesLoading = this.finance.quotesLoading;

  totalPosicoes(): number {
    return this.grupos().reduce((s, g) => s + g.ativos.length, 0);
  }
}
