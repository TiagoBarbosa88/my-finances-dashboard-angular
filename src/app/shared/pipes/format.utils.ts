/** Formata números como moeda BRL (pt-BR). */
export function formatCurrencyBRL(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) {
    return 'R$\u00a00,00';
  }

  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

/** Formata percentuais no padrão pt-BR. */
export function formatPercentBR(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) {
    return '0%';
  }

  const formatted = value.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return `${value >= 0 ? '+' : ''}${formatted}%`;
}
