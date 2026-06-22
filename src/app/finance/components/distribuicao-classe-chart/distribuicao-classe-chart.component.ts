import { DecimalPipe } from '@angular/common';
import { Component, inject, input, signal } from '@angular/core';

import { FinanceService } from '@app/core/services/finance.service';
import { PieChartItem } from '@app/shared/models/transaction.model';
import { CurrencyBrlPipe } from '@app/shared/pipes/currency-brl.pipe';
import { DonutChartComponent } from '@app/shared/ui/donut-chart/donut-chart.component';

/**
 * Donut de distribuição por classe de ativo (Ações, FIIs, ETFs, Criptos).
 * Componente burro — recebe dados prontos via input.
 */
@Component({
  selector: 'app-distribuicao-classe-chart',
  standalone: true,
  imports: [DonutChartComponent, DecimalPipe, CurrencyBrlPipe],
  templateUrl: './distribuicao-classe-chart.component.html',
  styleUrl: './distribuicao-classe-chart.component.css',
  host: { class: 'block h-full' },
})
export class DistribuicaoClasseChartComponent {
  data         = input.required<PieChartItem[]>();
  patrimonio   = input(0);
  centerSub    = input('Patrimônio');

  readonly finance = inject(FinanceService);
  readonly highlightedClasse = signal<string | null>(null);

  readonly pieTooltipFn = (name: string, value: number): string =>
    `${name}: ${value.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;

  classeDotStyle(name: string): Record<string, string> {
    const item = this.data().find((d) => d.name === name);
    return { background: item?.color ?? 'var(--muted-foreground)' };
  }

  onLegendEnter(name: string): void {
    this.highlightedClasse.set(name);
  }

  onLegendLeave(): void {
    this.highlightedClasse.set(null);
  }

  isLegendDimmed(name: string): boolean {
    const active = this.highlightedClasse();
    return active !== null && active !== name;
  }

  isLegendActive(name: string): boolean {
    return this.highlightedClasse() === name;
  }
}
