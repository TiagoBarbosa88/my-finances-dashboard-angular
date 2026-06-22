import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';

import {
  BrapiQuoteListResponse,
  BrapiQuoteResponse,
  BrapiStockSearchResult,
} from '@app/shared/models/brapi.model';
import { environment } from '../../../environments/environment';

const MAX_SYMBOLS_PER_REQUEST = 20;

@Injectable({ providedIn: 'root' })
export class StockService {
  private readonly http = inject(HttpClient);
  private readonly quoteUrl = `${environment.brapi.baseUrl}/quote`;
  private readonly searchUrl = `${environment.brapi.apiRoot}/quote/list`;

  /**
   * Autocomplete de ativos via GET /api/quote/list?search={query}.
   */
  searchStock(query: string): Observable<BrapiStockSearchResult[]> {
    const term = query.trim();
    if (term.length < 3) {
      return of([]);
    }

    const params = new HttpParams()
      .set('search', term)
      .set('limit', '10')
      .set('sortBy', 'name')
      .set('sortOrder', 'asc');

    return this.http
      .get<BrapiQuoteListResponse>(this.searchUrl, { params, headers: this.buildHeaders() })
      .pipe(
        map((response) =>
          (response.stocks ?? []).map((item) => ({
            symbol: item.stock.toUpperCase(),
            name: item.name,
            sector: item.sector ?? '',
            subType: item.subType ?? item.type ?? 'stock',
            price: item.close != null && Number.isFinite(item.close) ? item.close : null,
          })),
        ),
        catchError((err) => {
          console.error('[StockService] searchStock:', err);
          return of([]);
        }),
      );
  }

  /**
   * Busca cotações em tempo real na Brapi v2 para os tickers informados.
   * Retorna mapa ticker → preço (regularMarketPrice).
   */
  fetchQuotes(tickers: string[]): Observable<Map<string, number>> {
    const symbols = [...new Set(
      tickers.map((t) => t.trim().toUpperCase()).filter(Boolean),
    )];

    if (symbols.length === 0) {
      return of(new Map());
    }

    const batches = this.chunk(symbols, MAX_SYMBOLS_PER_REQUEST);
    const requests = batches.map((batch) => this.fetchQuoteBatch(batch));

    if (requests.length === 1) {
      return requests[0];
    }

    return forkJoin(requests).pipe(
      map((maps) => {
        const merged = new Map<string, number>();
        for (const batch of maps) {
          batch.forEach((price, ticker) => merged.set(ticker, price));
        }
        return merged;
      }),
    );
  }

  private fetchQuoteBatch(symbols: string[]): Observable<Map<string, number>> {
    const params = new HttpParams().set('symbols', symbols.join(','));

    return this.http
      .get<BrapiQuoteResponse>(this.quoteUrl, { params, headers: this.buildHeaders() })
      .pipe(
        map((response) => this.parseQuotes(response)),
        catchError((err) => {
          console.error('[StockService] fetchQuotes:', err);
          return of(new Map());
        }),
      );
  }

  private parseQuotes(response: BrapiQuoteResponse): Map<string, number> {
    const quotes = new Map<string, number>();

    for (const item of response.results ?? []) {
      const price = item.data?.regularMarketPrice;
      const symbol = (item.symbol ?? item.requestedSymbol)?.toUpperCase();

      if (symbol && price != null && Number.isFinite(price)) {
        quotes.set(symbol, price);
      }
    }

    return quotes;
  }

  private buildHeaders(): HttpHeaders | undefined {
    const token = environment.brapi.token?.trim();
    if (!token) return undefined;

    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  private chunk<T>(items: T[], size: number): T[][] {
    const batches: T[][] = [];

    for (let i = 0; i < items.length; i += size) {
      batches.push(items.slice(i, i + size));
    }

    return batches;
  }
}
