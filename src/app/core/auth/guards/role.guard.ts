import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { APP_HOME } from '@core/config/app-routes';
import { AuthService } from '@core/auth/services/auth.service';
import { UserRole } from '@shared/models/team.model';
import { environment } from 'src/environments/environment';

/**
 * Restringe rota a papéis específicos. Redireciona para o painel se não autorizado.
 */
export function roleGuard(allowed: UserRole[]): CanActivateFn {
  return () => {
    if (environment.bypassAuth) return true;

    const auth = inject(AuthService);
    const router = inject(Router);

    if (auth.hasAnyRole(allowed)) return true;

    return router.createUrlTree([APP_HOME]);
  };
}
