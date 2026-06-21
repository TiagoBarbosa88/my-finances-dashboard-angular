import { Component, input } from '@angular/core';

export type SummaryCardIcon = 'wallet' | 'check' | 'clock';

/**
 * Card de resumo financeiro — Totais, Pago e Pendente.
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
  positive = input(false);
  accent   = input('from-primary/30 to-primary/0');
  icon     = input<SummaryCardIcon>('wallet');

  /** Concatena as classes estáticas com o gradiente dinâmico do input `accent`. */
  glowClass(): string {
    return (
      'pointer-events-none absolute -right-10 -top-10 ' +
      'h-40 w-40 rounded-full bg-gradient-to-br blur-2xl ' +
      this.accent()
    );
  }
}
