import { Component, input } from '@angular/core';

export type SummaryCardIcon =
  | 'wallet'
  | 'check'
  | 'clock'
  | 'trending-up'
  | 'trending-down';

export type SummaryCardVariant = 'green' | 'red' | 'amber' | 'neutral';

/**
 * Card de resumo financeiro — Receitas, Despesas, Pendentes e Saldo.
 * Recebe todos os dados via `input()` para ser totalmente stateless.
 */
@Component({
  selector: 'app-summary-card',
  standalone: true,
  templateUrl: './summary-card.component.html',
})
export class SummaryCardComponent {
  label    = input.required<string>();
  value    = input.required<string>();
  change   = input.required<string>();
  positive   = input(false);
  variant    = input<SummaryCardVariant>('neutral');
  /** Sobrescreve a cor do valor (ex.: saldo dinâmico no card neutro). */
  valueTone  = input<SummaryCardVariant | null>(null);
  icon       = input<SummaryCardIcon>('wallet');

  cardClass(): string {
    const base =
      'group relative h-full overflow-hidden rounded-2xl border bg-card/80 p-4 ' +
      'shadow-sm backdrop-blur-sm transition-shadow duration-300 hover:shadow-md hover:shadow-black/30';

    if (this.variant() === 'neutral') {
      return `${base} border-border/80 ring-1 ring-foreground/10`;
    }

    return `${base} border-border`;
  }

  glowClass(): string {
    const base =
      'pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br blur-2xl ';

    switch (this.variant()) {
      case 'green':
        return base + 'from-success/25 to-success/0';
      case 'red':
        return base + 'from-destructive/25 to-destructive/0';
      case 'amber':
        return base + 'from-warning/25 to-warning/0';
      default:
        return base + 'from-foreground/10 to-foreground/0';
    }
  }

  iconBoxClass(): string {
    const base =
      'grid h-9 w-9 shrink-0 place-items-center rounded-lg ring-1 transition-colors';

    switch (this.variant()) {
      case 'green':
        return `${base} bg-success/10 text-success ring-success/20 group-hover:bg-success/15`;
      case 'red':
        return `${base} bg-destructive/10 text-destructive ring-destructive/20 group-hover:bg-destructive/15`;
      case 'amber':
        return `${base} bg-warning/10 text-warning ring-warning/20 group-hover:bg-warning/15`;
      default:
        return `${base} bg-foreground/5 text-foreground ring-foreground/15 group-hover:bg-foreground/10`;
    }
  }

  valueClass(): string {
    const tone = this.valueTone() ?? this.variant();

    switch (tone) {
      case 'green':
        return 'text-success';
      case 'red':
        return 'text-destructive';
      case 'amber':
        return 'text-warning';
      default:
        return 'text-foreground';
    }
  }

  footerClass(): string {
    const tone = this.valueTone() ?? this.variant();

    if (tone === 'amber') {
      return this.positive() ? 'text-success' : 'text-warning';
    }

    return this.positive() ? 'text-success' : 'text-destructive';
  }
}
