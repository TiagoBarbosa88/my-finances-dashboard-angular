import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { SupabaseService } from '@app/core/services/supabase.service';
import { environment } from 'src/environments/environment';

/**
 * Guarda as rotas do shell principal.
 *
 * Fluxo:
 *   1. Consulta a sessão ativa via `getSession()` (verifica o token JWT).
 *   2. Sessão válida  → `return true`  (navegação prossegue normalmente).
 *   3. Sem sessão     → redireciona para `/login` preservando a URL de destino
 *      no query param `returnUrl`, para que o login possa redirecionar de volta.
 */
export const authGuard: CanActivateFn = async (_route, state) => {
  if ( environment.bypassAuth) return true;

  const supabase = inject(SupabaseService);
  const router   = inject(Router);

   // Se o Supabase não estiver configurado, libera o acesso (modo dev local)
  if (!supabase.isConfigured()) return true;

  const session = await supabase.getSession();

  if (session) {
    return true;
  }

  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: state.url },
  });
};

/**
 * Guarda a rota `/login`.
 * Se o usuário já estiver autenticado, redireciona para `/` (evita exibir
 * a tela de login para quem já está logado).
 */
export const noAuthGuard: CanActivateFn = async () => {
  // Em modo dev, redireciona o /login direto para o dashboard
  if (environment.bypassAuth) return inject(Router).createUrlTree(['/']);

  const supabase = inject(SupabaseService);
  const router   = inject(Router);

  const session = await supabase.getSession();

  if (session) {
    return router.createUrlTree(['/']);
  }

  return true;
};
