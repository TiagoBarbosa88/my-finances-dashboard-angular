import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { SupabaseService } from '@app/core/services/supabase.service';
import { environment } from 'src/environments/environment';

/** Dashboard principal (após login). */
export const APP_HOME = '/app/painel';

async function hasAuthSession(): Promise<boolean> {
  const supabase = inject(SupabaseService);
  if (!supabase.isConfigured()) return false;
  const session = await supabase.getSession();
  return session != null;
}

/**
 * Landing `/` — exibe login ou redireciona quem já está autenticado.
 */
export const landingGuard: CanActivateFn = async () => {
  if (environment.bypassAuth) {
    return inject(Router).createUrlTree([APP_HOME]);
  }

  if (await hasAuthSession()) {
    return inject(Router).createUrlTree([APP_HOME]);
  }

  return true;
};

/**
 * Guarda rotas do app (`/app/*`).
 */
export const authGuard: CanActivateFn = async (_route, state) => {
  if (environment.bypassAuth) return true;

  const supabase = inject(SupabaseService);
  const router = inject(Router);

  if (!supabase.isConfigured()) return true;

  const session = await supabase.getSession();

  if (session) {
    return true;
  }

  return router.createUrlTree(['/'], {
    queryParams: { returnUrl: state.url },
  });
};

/** Compatibilidade — `/login` redireciona para `/`. */
export const noAuthGuard: CanActivateFn = async () => {
  return inject(Router).createUrlTree(['/']);
};
