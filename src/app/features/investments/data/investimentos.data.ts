import { Ativo, Investimento, TargetMeta, TipoAtivo } from '@shared/models/investimentos.model';

/** Ordem de exibição dos grupos na tabela. */
export const TIPOS_ATIVO_ORDEM: TipoAtivo[] = [
  'Ações',
  'FIIs',
  'ETFs',
  'Tesouro Direto',
];

/** Metas de alocação padrão (% da carteira). */
export const INITIAL_TARGET_METAS: TargetMeta[] = [
  { tipo: 'Ações',          targetPercent: 50 },
  { tipo: 'FIIs',           targetPercent: 25 },
  { tipo: 'ETFs',           targetPercent: 25 },
  { tipo: 'Tesouro Direto', targetPercent: 0  },
];

export const TARGET_METAS_STORAGE_KEY = 'my-finances-target-metas';

/** Chave de localStorage escopada por usuário. */
export function targetMetasStorageKey(userId?: string | null): string {
  return userId ? `${TARGET_METAS_STORAGE_KEY}:${userId}` : TARGET_METAS_STORAGE_KEY;
}

/** Proventos recebidos nos últimos 12 meses. */
export const PROVENTOS_12M = 776.23;

/** Proventos acumulados para compor Lucro Total (Ganho + Dividendos). */
export const PROVENTOS_ACUMULADOS = 4853.24;

/** Divisor dos proventos 12M no KPI de rentabilidade da carteira. */
export const FATOR_AJUSTE_RENTABILIDADE_12M =
  PROVENTOS_ACUMULADOS / PROVENTOS_12M / 2.187;

/** Cores por classe de ativo (donut). */
export const CLASSE_ATIVO_CORES: Record<TipoAtivo, string> = {
  'Ações':          'var(--chart-1)',
  'FIIs':           'var(--chart-2)',
  'ETFs':           'var(--chart-3)',
  'Tesouro Direto': 'var(--chart-4)',
};

/** Carteira inicial vazia — populada via CRUD ou Supabase. */
export const INITIAL_ATIVOS: Ativo[] = [];

/** Catálogo de ativos disponíveis no select (filtrado por tipo). */
export const CATALOGO_ATIVOS = [
  { ticker: 'Tesouro Selic 2029', tipo: 'Tesouro Direto' as TipoAtivo, setor: 'Renda Fixa' },
  { ticker: 'Tesouro IPCA+ 2035', tipo: 'Tesouro Direto' as TipoAtivo, setor: 'Renda Fixa' },
];

/** Histórico inicial de lançamentos (vazio — populado via CRUD). */
export const INITIAL_INVESTIMENTOS: Investimento[] = [];
