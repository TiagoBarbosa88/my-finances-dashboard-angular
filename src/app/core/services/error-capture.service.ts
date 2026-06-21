/** Equivalente a `src/lib/error-capture.ts` (React). */
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ErrorCaptureService {
  capture(error: unknown): void {
    console.error('[ErrorCaptureService]', error);
  }
}
