import { DecimalPipe } from '@angular/common';
import { Component, inject, input } from '@angular/core';

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
})
export class CategoryChartComponent {
  pieData  = input.required<PieChartItem[]>();
  barData  = input.required<BarChartItem[]>();
  pieTotal = input(0);

  readonly finance = inject(FinanceService);

  categoryDotStyle(name: string): Record<string, string> {
    return { background: this.finance.getCategoryColor(name) };
  }
}
