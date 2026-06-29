/** Resposta do endpoint GET /api/v2/stocks/quote (brapi.dev). */
export interface BrapiQuoteResponse {
  results: BrapiQuoteResult[];
  requestedAt?: string;
  took?: number;
}

export interface BrapiQuoteResult {
  requestedSymbol?: string;
  symbol: string;
  changed?: boolean;
  data?: {
    regularMarketPrice?: number;
    shortName?: string;
    longName?: string;
  };
}

/** Item retornado por GET /api/quote/list?search=... */
export interface BrapiQuoteListStock {
  stock: string;
  name: string;
  close?: number;
  sector?: string;
  type?: string;
  subType?: string;
}

export interface BrapiQuoteListResponse {
  stocks?: BrapiQuoteListStock[];
}

/** Resultado normalizado para autocomplete no modal. */
export interface BrapiStockSearchResult {
  symbol: string;
  name: string;
  sector: string;
  subType: string;
  price: number | null;
}
