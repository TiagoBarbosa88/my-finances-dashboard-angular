import { Transaction } from '@app/shared/models/transaction.model';

export const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 1,  data: '2026-01-05', descricao: 'Sabesp',             categoria: 'Moradia',     valor: 250.00,  status: 'pago',     criado_por: 'Tiago'   },
  { id: 2,  data: '2026-01-05', descricao: 'Enel',               categoria: 'Moradia',     valor: 100.00,  status: 'pago',     criado_por: 'Tiago'   },
  { id: 3,  data: '2026-01-05', descricao: 'Internet',           categoria: 'Tecnologia',  valor: 150.00,  status: 'pago',     criado_por: 'Tiago'   },
  { id: 4,  data: '2026-01-05', descricao: 'Vivo Celular',       categoria: 'Tecnologia',  valor:  80.00,  status: 'pago',     criado_por: 'Tiago'   },
  { id: 5,  data: '2026-01-05', descricao: 'Faculdade Giselle',  categoria: 'Educação',    valor: 145.00,  status: 'pago',     criado_por: 'Giselle' },
  { id: 6,  data: '2026-01-05', descricao: 'Faculdade Tiago',    categoria: 'Educação',    valor: 318.26,  status: 'pago',     criado_por: 'Tiago'   },
  { id: 7,  data: '2026-01-05', descricao: 'Garagem',            categoria: 'Transporte',  valor: 200.00,  status: 'pago',     criado_por: 'Tiago'   },
  { id: 8,  data: '2026-01-10', descricao: 'Pensão',             categoria: 'Dependentes', valor: 400.00,  status: 'pago',     criado_por: 'Tiago'   },
  { id: 9,  data: '2026-06-05', descricao: 'Sabesp',             categoria: 'Moradia',     valor: 250.00,  status: 'pendente', criado_por: 'Tiago'   },
  { id: 10, data: '2026-06-05', descricao: 'Enel',               categoria: 'Moradia',     valor: 100.00,  status: 'pendente', criado_por: 'Tiago'   },
  { id: 11, data: '2026-06-05', descricao: 'Faculdade Giselle',  categoria: 'Educação',    valor: 145.00,  status: 'pendente', criado_por: 'Giselle' },
];

export const CATEGORY_GOALS: Record<string, number> = {
  Moradia:     400,
  Tecnologia:  250,
  Educação:    500,
  Transporte:  250,
  Dependentes: 450,
};

export const PIE_COLORS: Record<string, string> = {
  Moradia:     'var(--chart-1)',
  Tecnologia:  'var(--chart-2)',
  Educação:    'var(--chart-3)',
  Transporte:  'var(--chart-4)',
  Dependentes: 'var(--chart-5)',
};

export const EXPENSE_CATEGORIES = [
  'Moradia',
  'Tecnologia',
  'Educação',
  'Transporte',
  'Dependentes',
] as const;

export const CATEGORIAS = {
  RECEITA: ['Salário', 'Décimo Terceiro', 'Férias', 'Bônus', 'Renda Extra', 'Outros'],
  DESPESA: ['Moradia', 'Alimentação', 'Transporte', 'Saúde', 'Educação', 'Lazer', 'Outros'],
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
