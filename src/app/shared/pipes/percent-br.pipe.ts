import { Pipe, PipeTransform } from '@angular/core';

import { formatPercentBR } from '@shared/pipes/format.utils';

/** Formata percentuais no padrão pt-BR. */
@Pipe({
  name: 'percentBR',
  standalone: true,
})
export class PercentBrPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    return formatPercentBR(value);
  }
}
