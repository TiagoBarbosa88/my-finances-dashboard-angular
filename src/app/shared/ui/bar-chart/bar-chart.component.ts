import { Component, computed, input } from '@angular/core';

import { BarChartItem, BarSlice } from '@shared/models/transaction.model';

interface YTick {
  value: number;
  y: number;
  label: string;
}

/**
 * Grouped bar chart em SVG puro — substitui o <BarChart> do Recharts.
 * Barras azinhas lado a lado: meta (cinza) + gasto (primary).
 */
@Component({
  selector: 'app-bar-chart',
  standalone: true,
  templateUrl: './bar-chart.component.html',
})
export class BarChartComponent {
  data = input.required<BarChartItem[]>();

  // Dimensões do SVG — públicas para uso no template
  readonly W   = 480;
  readonly H   = 240;   // altura aumentada para acomodar labels sem corte
  readonly PAD = { top: 16, right: 16, bottom: 48, left: 52 };  // bottom maior para labels

  readonly iW = this.W - this.PAD.left - this.PAD.right;   // 412
  readonly iH = this.H - this.PAD.top  - this.PAD.bottom;  // 176

  readonly maxVal = computed(() => {
    const vals = this.data().flatMap((d) => [d.gasto, d.meta]);
    return Math.max(...vals, 1);
  });

  /** Arredonda para cima para um número "bonito" (1 / 2 / 5 × 10^n). */
  readonly niceMax = computed(() => {
    const m = this.maxVal();
    const exp = Math.floor(Math.log10(m));
    const f   = m / Math.pow(10, exp);
    const nf  = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
    return nf * Math.pow(10, exp);
  });

  readonly yTicks = computed<YTick[]>(() => {
    const nm  = this.niceMax();
    const iH  = this.iH;
    const pad = this.PAD;
    return Array.from({ length: 5 }, (_, i) => {
      const value = (nm / 4) * i;
      const y     = pad.top + iH - (value / nm) * iH;
      return { value, y, label: this.fmtY(value) };
    });
  });

  readonly bars = computed<BarSlice[]>(() => {
    const nm   = this.niceMax();
    const iH   = this.iH;
    const iW   = this.iW;
    const pad  = this.PAD;
    const data = this.data();
    const gW   = iW / Math.max(data.length, 1);
    const bW   = Math.min(Math.floor(gW * 0.32), 32);  // barras ligeiramente mais largas
    const gap  = 5;
    const base = pad.top + iH;

    return data.map((item, i) => {
      const cx = pad.left + i * gW + gW / 2;
      const mH = nm > 0 ? (item.meta  / nm) * iH : 0;
      const gH = nm > 0 ? (item.gasto / nm) * iH : 0;

      return {
        cat:      item.cat,
        labelX:   cx,
        labelY:   base + 20,  // mais espaço abaixo da linha de base
        meta:     { x: cx - bW - gap / 2, y: base - mH, w: bW, h: Math.max(mH, 0) },
        gasto:    { x: cx + gap / 2,      y: base - gH, w: bW, h: Math.max(gH, 0) },
        metaVal:  item.meta,
        gastoVal: item.gasto,
      };
    });
  });

  /** Linhas horizontais de grade (sem a linha de base). */
  readonly gridLines = computed(() =>
    this.yTicks()
      .slice(1)
      .map((t) => t.y),
  );

  readonly baseY = computed(() => this.PAD.top + this.iH);

  private fmtY(v: number): string {
    if (v >= 1000) return `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k`;
    return v.toFixed(0);
  }
}
