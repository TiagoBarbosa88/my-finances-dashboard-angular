import { Transaction } from '@shared/models/transaction.model';

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const CATEGORY_GOALS: Record<string, number> = {
  Moradia:     400,
  Tecnologia:  250,
  Educação:    500,
  Transporte:  250,
  Dependentes: 450,
  Outros:      300,
};

export const PIE_COLORS: Record<string, string> = {
  Moradia:      'var(--chart-1)',
  Tecnologia:   'var(--chart-2)',
  Educação:     'var(--chart-3)',
  Transporte:   'var(--chart-4)',
  Dependentes:  'var(--chart-5)',
  Alimentação:  'var(--chart-3)',
  Saúde:        'var(--chart-2)',
  Lazer:        'var(--chart-4)',
  Outros:       'var(--chart-5)',
};

/** Rótulos curtos para o gráfico de barras. */
export const CATEGORY_SHORT_LABELS: Record<string, string> = {
  Moradia:      'Moradia',
  Tecnologia:   'Tecnol.',
  Educação:     'Educação',
  Transporte:   'Transp.',
  Dependentes:  'Depend.',
  Alimentação:  'Aliment.',
  Saúde:        'Saúde',
  Lazer:        'Lazer',
  Outros:       'Outros',
};

export const CHART_PALETTE = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
] as const;

export function resolveCategoryColor(name: string, index = 0): string {
  return PIE_COLORS[name] ?? CHART_PALETTE[index % CHART_PALETTE.length];
}

export const EXPENSE_CATEGORIES = [
  'Moradia',
  'Tecnologia',
  'Educação',
  'Transporte',
  'Dependentes',
] as const;

export const CATEGORIAS = {
  RECEITA: ['Salário', 'Décimo Terceiro', 'Férias', 'Bônus', 'Renda Extra', 'Outros'],
  DESPESA: ['Moradia', 'Alimentação', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Investimento', 'Outros'],
} as const;

export type TipoTransacao = keyof typeof CATEGORIAS;

export const BAR_CATEGORIES = [
  { key: 'Moradia',     label: 'Moradia'  },
  { key: 'Tecnologia',  label: 'Tecnol.'  },
  { key: 'Educação',    label: 'Educação' },
  { key: 'Transporte',  label: 'Transp.'  },
  { key: 'Dependentes', label: 'Depend.'  },
] as const;

export const STATUS_STORAGE_KEY = 'my-finances-statuses-v2';

/** Chave de localStorage escopada por usuário (evita vazamento entre contas no mesmo browser). */
export function statusStorageKey(userId?: string | null): string {
  return userId ? `${STATUS_STORAGE_KEY}:${userId}` : STATUS_STORAGE_KEY;
}
