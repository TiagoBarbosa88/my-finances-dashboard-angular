import { DecimalPipe } from '@angular/common';
import { Component, computed, input, signal } from '@angular/core';

import { GrupoAtivos } from '@app/shared/models/investimentos.model';

export interface BarSegment {
  ticker: string;
  pct: number;
  color: string;
}

export interface CategoriaBarra {
  tipo: string;
  segments: BarSegment[];
  vazia: boolean;
}

const SEGMENT_PALETTE = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  '#6366f1',
  '#14b8a6',
  '#f97316',
];

/**
 * Barras horizontais empilhadas — peso de cada ativo dentro da categoria.
 */
@Component({
  selector: 'app-distribuicao-ativos-barras',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './distribuicao-ativos-barras.component.html',
  host: { class: 'block h-full min-h-0' },
})
export class DistribuicaoAtivosBarrasComponent {
  grupos = input.required<GrupoAtivos[]>();

  readonly hovered = signal<BarSegment | null>(null);

  readonly categorias = computed<CategoriaBarra[]>(() =>
    this.grupos().map((grupo) => {
      const total = grupo.valorTotal;

      if (total <= 0 || grupo.ativos.length === 0) {
        return { tipo: grupo.tipo, segments: [], vazia: true };
      }

      const segments = grupo.ativos.map((ativo, index) => ({
        ticker: ativo.ticker,
        pct: (ativo.valorTotal / total) * 100,
        color: SEGMENT_PALETTE[index % SEGMENT_PALETTE.length],
      }));

      return { tipo: grupo.tipo, segments, vazia: false };
    }),
  );

  onEnter(segment: BarSegment): void {
    this.hovered.set(segment);
  }

  onLeave(): void {
    this.hovered.set(null);
  }
}
