/** Equivalente a `src/lib/lovable-error-reporting.ts` (React). */
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ErrorReportingService {
  report(error: unknown, context?: Record<string, unknown>): void {
    console.error('[ErrorReportingService]', error, context);
  }
}
