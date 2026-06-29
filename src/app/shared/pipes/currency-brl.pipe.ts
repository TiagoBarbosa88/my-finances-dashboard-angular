import { Pipe, PipeTransform } from '@angular/core';

import { formatCurrencyBRL } from '@shared/pipes/format.utils';

/** Formata números como moeda BRL (pt-BR). */
@Pipe({
  name: 'currencyBRL',
  standalone: true,
})
export class CurrencyBrlPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    return formatCurrencyBRL(value);
  }
}
