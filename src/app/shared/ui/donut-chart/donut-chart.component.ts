import { Component, computed, input, output, signal } from '@angular/core';

import { ArcSlice, PieChartItem } from '@app/shared/models/transaction.model';

/**
 * Donut chart em SVG puro — sem dependências externas.
 * Substitui o <PieChart> do Recharts do React.
 */
@Component({
  selector: 'app-donut-chart',
  standalone: true,
  templateUrl: './donut-chart.component.html',
  styleUrl: './donut-chart.component.css',
})
export class DonutChartComponent {
  data            = input.required<PieChartItem[]>();
  centerText      = input('');
  centerSub       = input('Total');
  highlightedName = input<string | null>(null);
  formatTooltip   = input<(name: string, value: number) => string>(
    (name, value) => `${name}: ${value}`,
  );

  /** Emitido ao passar o mouse sobre uma fatia (sincroniza legenda). */
  sliceHighlight = output<string | null>();

  private readonly hoveredName = signal<string | null>(null);

  readonly activeName = computed(
    () => this.highlightedName() ?? this.hoveredName(),
  );

  private readonly CX       = 120;
  private readonly CY       = 120;
  private readonly INNER_R  = 68;
  private readonly OUTER_R  = 96;
  private readonly GAP_DEG  = 3;

  readonly arcs = computed<ArcSlice[]>(() => this.buildArcs(this.data()));

  tooltipFor(arc: ArcSlice): string {
    return this.formatTooltip()(arc.name, arc.value);
  }

  isDimmed(name: string): boolean {
    const active = this.activeName();
    return active !== null && active !== name;
  }

  isHighlighted(name: string): boolean {
    return this.activeName() === name;
  }

  onSliceEnter(name: string): void {
    this.hoveredName.set(name);
    this.sliceHighlight.emit(name);
  }

  onSliceLeave(): void {
    this.hoveredName.set(null);
    this.sliceHighlight.emit(null);
  }

  private buildArcs(items: PieChartItem[]): ArcSlice[] {
    const sum = items.reduce((s, i) => s + i.value, 0);
    if (!sum) return [];

    let angle = -90;
    return items.map((item) => {
      const sweepFull = (item.value / sum) * 360;
      const sweep = items.length === 1 ? 359.99 : sweepFull - this.GAP_DEG;
      const d = this.arcPath(angle, angle + sweep);
      angle += sweepFull;
      return { d, color: item.color, name: item.name, value: item.value };
    });
  }

  private arcPath(startDeg: number, endDeg: number): string {
    const toRad = (d: number) => (d * Math.PI) / 180;
    const px    = (r: number, d: number) => this.CX + r * Math.cos(toRad(d));
    const py    = (r: number, d: number) => this.CY + r * Math.sin(toRad(d));
    const oR    = this.OUTER_R;
    const iR    = this.INNER_R;
    const large = endDeg - startDeg > 180 ? 1 : 0;

    return [
      `M ${px(oR, startDeg)} ${py(oR, startDeg)}`,
      `A ${oR} ${oR} 0 ${large} 1 ${px(oR, endDeg)} ${py(oR, endDeg)}`,
      `L ${px(iR, endDeg)} ${py(iR, endDeg)}`,
      `A ${iR} ${iR} 0 ${large} 0 ${px(iR, startDeg)} ${py(iR, startDeg)}`,
      'Z',
    ].join(' ');
  }
}
