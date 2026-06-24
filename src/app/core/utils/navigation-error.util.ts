import { NavigationError, Router } from '@angular/router';

const CHUNK_RELOAD_KEY = 'smart-finances:chunk-reload';

/** Detecta falha de lazy-load após deploy (cache desatualizado). */
export function isChunkLoadError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : '';

  const lower = message.toLowerCase();
  return (
    lower.includes('chunkloaderror') ||
    lower.includes('failed to fetch dynamically imported module') ||
    lower.includes('loading chunk') ||
    lower.includes('loading css chunk')
  );
}

/**
 * Recarrega a página uma vez quando chunk lazy-load falha; evita loop infinito.
 */
export function handleNavigationError(error: NavigationError, router: Router): void {
  const cause = error.error ?? error;

  if (!isChunkLoadError(cause)) {
    console.error('[Router] Navigation error:', cause);
    return;
  }

  console.warn('[Router] Chunk desatualizado — tentando recarregar a aplicação.');

  if (typeof sessionStorage !== 'undefined' && !sessionStorage.getItem(CHUNK_RELOAD_KEY)) {
    sessionStorage.setItem(CHUNK_RELOAD_KEY, '1');
    window.location.assign(router.url || '/');
    return;
  }

  sessionStorage.removeItem(CHUNK_RELOAD_KEY);
  void router.navigateByUrl('/erro-navegacao', { skipLocationChange: false });
}
