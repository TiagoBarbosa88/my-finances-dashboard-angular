/** Classes de ativos suportadas na carteira. */
export type TipoAtivo = 'Ações' | 'FIIs' | 'ETFs' | 'Tesouro Direto';

/** Operação de lançamento na carteira. */
export type OperacaoInvestimento = 'compra' | 'venda';

/** Meta de alocação por classe de ativo (% da carteira). */
export interface TargetMeta {
  tipo: string;
  targetPercent: number;
}

/** Resultado do rebalanceamento por tipo. */
export interface RebalanceTipo {
  tipo: string;
  targetPercent: number;
  currentPercent: number;
  currentValue: number;
  targetValue: number;
  /** (Patrimônio × Target%) − Valor atual. Positivo = falta comprar. */
  gap: number;
  aporteSugerido: number;
  needsRebalance: boolean;
}

/** Posição bruta — valores derivados são calculados no FinanceService. */
export interface Ativo {
  id: number;
  ticker: string;
  tipo: TipoAtivo;
  setor: string;
  qtd: number;
  precoMedio: number;
  precoAtual: number;
  /** Rentabilidade total (incl. proventos) quando informada na origem. */
  rentabilidadePct?: number;
  /** Nota de qualidade do ativo (0–10) para sugestão de compra. */
  score?: number;
}

/** Lançamento de compra/venda persistido no JSON Server. */
export interface Investimento {
  id: number;
  operacao: OperacaoInvestimento;
  tipo: TipoAtivo;
  ticker: string;
  setor: string;
  data: string;
  quantidade: number;
  preco: number;
  outrosCustos: number;
  valorTotal: number;
  criado_por: string;
  /** Nota de qualidade (0–10). */
  score?: number;
  /** Sugestão de compra calculada pelo rebalanceamento. */
  buyRecommendation?: boolean;
}

export type InvestimentoDraft = Omit<Investimento, 'id' | 'valorTotal'>;

/** Ativo enriquecido via computed signals (sem duplicar lógica na UI). */
export interface AtivoEnriquecido extends Ativo {
  valorTotal: number;
  pctCarteira: number;
  variacaoPct: number;
  rentabilidadePct: number;
  score: number;
  buyRecommendation: boolean;
}

/** Agrupamento por tipo para a tabela de ativos. */
export interface GrupoAtivos {
  tipo: TipoAtivo;
  ativos: AtivoEnriquecido[];
  valorTotal: number;
}

/** KPIs consolidados da carteira. */
export interface InvestimentosResumo {
  patrimonioTotal: number;
  aportesTotal: number;
  ganhoCapital: number;
  lucroTotal: number;
  proventos12m: number;
  proventosAcumulados: number;
  rentabilidadeTotal: number;
  variacaoPct: number;
}
