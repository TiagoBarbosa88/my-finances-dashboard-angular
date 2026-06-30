import { DecimalPipe } from '@angular/common';
import { Component, inject, input, signal } from '@angular/core';

import { FinanceService } from '@core/api/finance.service';
import { PieChartItem, ReceitaBreakdownItem } from '@shared/models/transaction.model';
import { DonutChartComponent } from '@shared/ui/donut-chart/donut-chart.component';

@Component({
  selector: 'app-receitas-chart',
  standalone: true,
  imports: [DonutChartComponent, DecimalPipe],
  templateUrl: './receitas-chart.component.html',
  styleUrl: './receitas-chart.component.css',
})
export class ReceitasChartComponent {
  pieData = input.required<PieChartItem[]>();
  breakdown = input.required<ReceitaBreakdownItem[]>();
  pieTotal = input(0);
  cardTotal = input(0);

  readonly finance = inject(FinanceService);
  readonly highlightedCategory = signal<string | null>(null);

  categoryDotStyle(name: string): Record<string, string> {
    return { background: this.finance.getCategoryColor(name) };
  }

  readonly pieTooltipFn = (name: string, value: number): string =>
    `${name}: ${this.finance.formatCurrency(value)}`;

  onLegendEnter(name: string): void {
    this.highlightedCategory.set(name);
  }

  onLegendLeave(): void {
    this.highlightedCategory.set(null);
  }

  isLegendDimmed(name: string): boolean {
    const active = this.highlightedCategory();
    return active !== null && active !== name;
  }

  isLegendActive(name: string): boolean {
    return this.highlightedCategory() === name;
  }

  isAmbiguousCategory(categoria: string): boolean {
    return categoria === 'Outros';
  }
}
