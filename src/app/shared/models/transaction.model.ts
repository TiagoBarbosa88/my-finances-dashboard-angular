export type TransactionStatus = 'pago' | 'pendente';

/** Opções de recorrência ao criar um lançamento. */
export interface TransactionRecurrence {
  recorrente: boolean;
  vezes: number;
}

/** Campos idênticos ao JSON fornecido pelo back-end / mock. */
export interface Transaction {
  id: number;
  data: string;        // ISO: "2026-06-05"
  descricao: string;
  categoria: string;
  valor: number;       // sempre positivo — todas as entradas são despesas
  status: TransactionStatus;
  criado_por: string;
  /** Dono do lançamento — usado para permissões Editor vs Admin. */
  user_id?: number;
}

/** Resumo mensal baseado em despesas. */
export interface FinanceStats {
  total: number;     // soma de todas as despesas do mês
  pago: number;      // soma das pagas
  pendente: number;  // soma das pendentes
}

export interface PieChartItem {
  name: string;
  value: number;
  color: string;
}

export interface BarChartItem {
  cat: string;      // label do eixo X
  gasto: number;
  meta: number;
}

export interface ArcSlice {
  d: string;        // SVG path
  color: string;
  name: string;
  value: number;
}

export interface BarSlice {
  cat: string;
  labelX: number;
  labelY: number;
  meta: { x: number; y: number; w: number; h: number };
  gasto: { x: number; y: number; w: number; h: number };
  metaVal: number;
  gastoVal: number;
}
