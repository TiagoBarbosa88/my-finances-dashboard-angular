import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CLASSE_ATIVO_CORES } from '@features/investments/data/investimentos.data';
import { FinanceService } from '@core/api/finance.service';
import { RebalanceTipo, TipoAtivo } from '@shared/models/investimentos.model';
import { CurrencyBrlPipe } from '@shared/pipes/currency-brl.pipe';

/**
 * Metas de alocação — seção expansível, total limitado a 100%.
 */
@Component({
  selector: 'app-investimentos-metas',
  standalone: true,
  imports: [FormsModule, CurrencyBrlPipe, DecimalPipe],
  templateUrl: './investimentos-metas.component.html',
})
export class InvestimentosMetasComponent {
  private readonly finance = inject(FinanceService);

  readonly rebalance = this.finance.rebalancePorTipo;
  readonly sectionExpanded = signal(true);

  readonly totalTargetPercent = computed(() =>
    this.finance.targetMetas().reduce((s, m) => s + m.targetPercent, 0),
  );

  readonly remainingPercent = computed(() =>
    Math.max(0, 100 - this.totalTargetPercent()),
  );

  readonly classesParaAportar = computed(() =>
    this.rebalance().filter((i) => i.needsRebalance).length,
  );

  readonly totalCompleto = computed(() => this.totalTargetPercent() === 100);

  toggleSection(): void {
    this.sectionExpanded.update((v) => !v);
  }

  maxTargetFor(tipo: string): number {
    return this.finance.maxTargetFor(tipo);
  }

  onTargetChange(tipo: string, value: string | number): void {
    const parsed = typeof value === 'string' ? parseFloat(value) : value;
    if (Number.isNaN(parsed)) return;
    this.finance.updateTargetMeta(tipo, parsed);
  }

  tipoColor(tipo: string): string {
    return CLASSE_ATIVO_CORES[tipo as TipoAtivo] ?? 'var(--chart-1)';
  }

  shortLabel(tipo: string): string {
    return tipo === 'Tesouro Direto' ? 'Tesouro' : tipo;
  }

  trackWidth(percent: number): number {
    return Math.min(Math.max(percent, 0), 100);
  }

  currentTrackClass(item: RebalanceTipo): string {
    if (item.currentPercent < item.targetPercent) return 'bg-emerald-500/90';
    if (item.currentPercent > item.targetPercent) return 'bg-red-500/90';
    return 'bg-muted-foreground/50';
  }

  currentPctClass(item: RebalanceTipo): string {
    if (item.currentPercent < item.targetPercent) return 'text-emerald-400';
    if (item.currentPercent > item.targetPercent) return 'text-red-400';
    return 'text-foreground';
  }

  statusLabel(item: RebalanceTipo): string {
    if (item.needsRebalance) return 'Aportar';
    if (item.currentPercent > item.targetPercent) return 'Acima';
    return 'Ok';
  }

  statusClass(item: RebalanceTipo): string {
    if (item.needsRebalance) {
      return 'text-emerald-400 bg-emerald-500/10 ring-emerald-500/25';
    }
    if (item.currentPercent > item.targetPercent) {
      return 'text-red-400 bg-red-500/10 ring-red-500/25';
    }
    return 'text-muted-foreground bg-muted/30 ring-border/60';
  }
}
