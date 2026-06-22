import { Ativo, Investimento, TipoAtivo } from '@app/shared/models/investimentos.model';

/** Ordem de exibição dos grupos na tabela. */
export const TIPOS_ATIVO_ORDEM: TipoAtivo[] = [
  'Ações',
  'FIIs',
  'ETFs',
  'Tesouro Direto',
];

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

/** Carteira real do usuário (8 posições). */
export const INITIAL_ATIVOS: Ativo[] = [
  // ── Ações ──
  { id: 1, ticker: 'ITUB4',  tipo: 'Ações', setor: 'Financeiro',   qtd: 15, precoMedio: 41.00,  precoAtual: 39.87, rentabilidadePct: 0.83 },
  { id: 2, ticker: 'TAEE11', tipo: 'Ações', setor: 'Energia',      qtd: 11, precoMedio: 41.48,  precoAtual: 39.30, rentabilidadePct: -3.87 },
  { id: 3, ticker: 'AESB3',  tipo: 'Ações', setor: 'Energia',      qtd: 33, precoMedio: 12.15,  precoAtual: 8.12,  rentabilidadePct: -31.60 },
  { id: 4, ticker: 'SAPR4',  tipo: 'Ações', setor: 'Saneamento',   qtd: 23, precoMedio: 8.61,   precoAtual: 7.27,  rentabilidadePct: 73.45 },
  { id: 5, ticker: 'BBAS3',  tipo: 'Ações', setor: 'Financeiro',   qtd: 6,  precoMedio: 23.37,  precoAtual: 19.42, rentabilidadePct: 75.93 },
  { id: 6, ticker: 'MGLU3',  tipo: 'Ações', setor: 'Varejo',       qtd: 1,  precoMedio: 65.53,  precoAtual: 4.62,  rentabilidadePct: -77.29 },

  // ── FIIs ──
  { id: 7, ticker: 'PCIP11', tipo: 'FIIs',  setor: 'Papel',        qtd: 1,  precoMedio: 118.29, precoAtual: 80.26, rentabilidadePct: -9.35 },

  // ── ETFs ──
  { id: 8, ticker: 'SPXB11', tipo: 'ETFs',  setor: 'S&P 500',      qtd: 21, precoMedio: 15.79,  precoAtual: 17.05, rentabilidadePct: 113.53 },
];

/** Catálogo de ativos disponíveis no select (filtrado por tipo). */
export const CATALOGO_ATIVOS = [
  ...INITIAL_ATIVOS.map(({ ticker, tipo, setor }) => ({ ticker, tipo, setor })),
  { ticker: 'Tesouro Selic 2029', tipo: 'Tesouro Direto' as TipoAtivo, setor: 'Renda Fixa' },
  { ticker: 'Tesouro IPCA+ 2035', tipo: 'Tesouro Direto' as TipoAtivo, setor: 'Renda Fixa' },
];

/** Histórico inicial de lançamentos (vazio — populado via CRUD). */
export const INITIAL_INVESTIMENTOS: Investimento[] = [];
