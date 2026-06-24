import { DecimalPipe } from '@angular/common';
import { Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuthService } from '@app/core/services/auth.service';
import { CLASSE_ATIVO_CORES } from '@app/core/services/investimentos.data';
import { FinanceService } from '@app/core/services/finance.service';
import { AtivoEnriquecido, GrupoAtivos, SugestaoInvestimento, TipoAtivo } from '@app/shared/models/investimentos.model';
import { CurrencyBrlPipe } from '@app/shared/pipes/currency-brl.pipe';
import { formatCurrencyBRL } from '@app/shared/pipes/format.utils';
import { PercentBrPipe } from '@app/shared/pipes/percent-br.pipe';

/**
 * Carteira agrupada por tipo — acordeões expansíveis com coluna Ativo fixa no scroll horizontal.
 */
@Component({
  selector: 'app-meus-ativos-table',
  standalone: true,
  imports: [FormsModule, CurrencyBrlPipe, PercentBrPipe, DecimalPipe],
  templateUrl: './meus-ativos-table.component.html',
})
export class MeusAtivosTableComponent {
  private readonly finance = inject(FinanceService);
  private readonly auth = inject(AuthService);

  grupos = input.required<GrupoAtivos[]>();
  showActions = input(true);

  edit = output<AtivoEnriquecido>();

  readonly quotesLoading = this.finance.quotesLoading;

  /** Estado aberto/fechado de cada tipo de ativo. */
  private readonly expanded = signal<Record<string, boolean>>({});

  canEditScore(): boolean {
    return this.auth.canManageInvestments();
  }

  totalPosicoes(): number {
    return this.grupos().reduce((s, g) => s + g.ativos.length, 0);
  }

  isExpanded(tipo: string): boolean {
    return this.expanded()[tipo] ?? false;
  }

  toggleGrupo(tipo: string): void {
    this.expanded.update((state) => ({
      ...state,
      [tipo]: !state[tipo],
    }));
  }

  onScoreChange(ativo: AtivoEnriquecido, value: string | number): void {
    const parsed = typeof value === 'string' ? parseFloat(value) : value;
    if (Number.isNaN(parsed)) return;
    this.finance.updateAtivoScore(ativo.id, parsed);
  }

  sugestaoClass(sugestao: SugestaoInvestimento): string {
    switch (sugestao) {
      case 'Comprar':
        return 'bg-green-500 text-white';
      case 'Risco (Concentrado)':
        return 'bg-yellow-500 text-yellow-950';
      case 'Reavaliar (Nota Baixa)':
        return 'bg-amber-500/20 text-amber-300 ring-1 ring-amber-500/40';
      default:
        return 'bg-red-600 text-white';
    }
  }

  tipoIcon(tipo: TipoAtivo): string {
    switch (tipo) {
      case 'FIIs':           return 'FII';
      case 'ETFs':           return 'ETF';
      case 'Tesouro Direto': return 'TD';
      default:               return 'AÇ';
    }
  }

  tipoIconStyle(tipo: TipoAtivo): Record<string, string> {
    const color = CLASSE_ATIVO_CORES[tipo] ?? 'var(--chart-1)';
    return {
      background: `color-mix(in oklab, ${color} 25%, transparent)`,
      color,
      borderColor: `color-mix(in oklab, ${color} 45%, transparent)`,
    };
  }

  patrimonioTotal(): number {
    return this.grupos().reduce((s, g) => s + g.valorTotal, 0);
  }

  pctCarteiraGrupo(grupo: GrupoAtivos): number {
    const total = this.patrimonioTotal();
    return total > 0 ? (grupo.valorTotal / total) * 100 : 0;
  }

  metaGrupo(grupo: GrupoAtivos): number {
    const fromAtivo = grupo.ativos[0]?.metaCategoria;
    if (fromAtivo != null) return fromAtivo;

    return (
      this.finance.targetMetas().find((meta) => meta.tipo === grupo.tipo)?.targetPercent ?? 0
    );
  }

  variacaoGrupo(grupo: GrupoAtivos): number {
    if (grupo.valorTotal <= 0 || grupo.ativos.length === 0) return 0;

    const weighted = grupo.ativos.reduce(
      (sum, a) => sum + a.variacaoPct * a.valorTotal,
      0,
    );

    return weighted / grupo.valorTotal;
  }

  rentabilidadeGrupo(grupo: GrupoAtivos): number {
    if (grupo.valorTotal <= 0 || grupo.ativos.length === 0) return 0;

    const weighted = grupo.ativos.reduce(
      (sum, a) => sum + a.rentabilidadePct * a.valorTotal,
      0,
    );

    return weighted / grupo.valorTotal;
  }

  pctClass(value: number): string {
    if (value > 0) return 'text-green-400';
    if (value < 0) return 'text-red-400';
    return 'text-warning';
  }

  /** Valor compacto para o resumo mobile (ex.: R$ 1,6K). */
  valorResumoMobile(value: number): string {
    if (value === 0) return 'R$ 0,00';

    const abs = Math.abs(value);

    if (abs >= 1_000_000) {
      const compact = value / 1_000_000;
      return `R$ ${compact.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}M`;
    }

    if (abs >= 1_000) {
      const compact = value / 1_000;
      return `R$ ${compact.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}K`;
    }

    return formatCurrencyBRL(value);
  }
}
