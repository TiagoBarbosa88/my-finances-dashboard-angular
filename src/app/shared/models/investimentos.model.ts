/** Classes de ativos suportadas na carteira. */
export type TipoAtivo = 'Ações' | 'FIIs' | 'ETFs' | 'Tesouro Direto';

/** Operação de lançamento na carteira. */
export type OperacaoInvestimento = 'compra' | 'venda';

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
}

export type InvestimentoDraft = Omit<Investimento, 'id' | 'valorTotal'>;

/** Ativo enriquecido via computed signals (sem duplicar lógica na UI). */
export interface AtivoEnriquecido extends Ativo {
  valorTotal: number;
  pctCarteira: number;
  variacaoPct: number;
  rentabilidadePct: number;
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
