import { DecimalPipe } from '@angular/common';
import { Component, inject, input, signal } from '@angular/core';

import { FinanceService } from '@app/core/services/finance.service';
import { BarChartItem, PieChartItem } from '@app/shared/models/transaction.model';
import { BarChartComponent } from '@app/shared/ui/bar-chart/bar-chart.component';
import { DonutChartComponent } from '@app/shared/ui/donut-chart/donut-chart.component';

/**
 * Seção de gráficos: donut de categorias (col-2) + barras de metas (col-3).
 * Encapsula o layout `grid lg:grid-cols-5` e ambos os componentes SVG.
 */
@Component({
  selector: 'app-category-chart',
  standalone: true,
  imports: [DonutChartComponent, BarChartComponent, DecimalPipe],
  templateUrl: './category-chart.component.html',
  styleUrl: './category-chart.component.css',
})
export class CategoryChartComponent {
  pieData  = input.required<PieChartItem[]>();
  barData  = input.required<BarChartItem[]>();
  pieTotal = input(0);

  readonly finance = inject(FinanceService);

  /** Categoria destacada via legenda ou fatia do donut. */
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
}
