import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import type { Session } from '@supabase/supabase-js';

import { AuthService } from '@app/core/services/auth.service';
import { FinanceService } from '@app/core/services/finance.service';
import { SupabaseService } from '@app/core/services/supabase.service';
import { environment } from 'src/environments/environment';

/** Dashboard principal (após login). */
export const APP_HOME = '/app/painel';

function isTransientAuthError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('rate limit') ||
    lower.includes('too many requests') ||
    lower.includes('fetch') ||
    lower.includes('network') ||
    lower.includes('timeout') ||
    lower.includes('temporarily unavailable')
  );
}

async function resolveValidSession(): Promise<Session | null> {
  const supabase = inject(SupabaseService);
  if (!supabase.isConfigured()) return null;

  const session = await supabase.getSession();
  if (!session) return null;

  const { data, error } = await supabase.client.auth.getUser();
  if (error) {
    if (isTransientAuthError(error.message)) {
      console.warn('[authGuard] getUser temporariamente indisponível — mantendo sessão.');
      return session;
    }
    await supabase.signOut();
    return null;
  }

  if (!data.user) {
    await supabase.signOut();
    return null;
  }

  return session;
}

function urlHasAuthCallback(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.location.hash.includes('access_token=') ||
    window.location.search.includes('code=')
  );
}

async function bootstrapSessionAfterRedirect(): Promise<{ session: boolean; type: string | null }> {
  const supabase = inject(SupabaseService);
  const auth = inject(AuthService);
  const finance = inject(FinanceService);

  const { session, type } = await supabase.processAuthRedirectFromUrl();
  if (!session) return { session: false, type };

  await auth.refreshProfileFromSupabase();
  finance.loadTransactions();
  finance.loadCarteiraAtivos();
  finance.loadInvestimentos();

  return { session: true, type };
}

/**
 * Landing `/` — exibe login ou redireciona quem já está autenticado.
 */
export const landingGuard: CanActivateFn = async () => {
  if (environment.bypassAuth) {
    return inject(Router).createUrlTree([APP_HOME]);
  }

  const router = inject(Router);
  const supabase = inject(SupabaseService);

  if (urlHasAuthCallback() && supabase.isConfigured()) {
    const { session, type } = await bootstrapSessionAfterRedirect();
    if (session) {
      if (type === 'invite') {
        return router.createUrlTree(['/bem-vindo']);
      }
      return router.createUrlTree([APP_HOME]);
    }
    return true;
  }

  if (await resolveValidSession()) {
    return router.createUrlTree([APP_HOME]);
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

  const session = await resolveValidSession();

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
