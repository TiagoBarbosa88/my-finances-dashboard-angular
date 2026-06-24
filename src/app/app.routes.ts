import { Routes } from '@angular/router';

import { APP_NAME } from '@app/core/constants/app-brand';
import {
  APP_HOME,
  APP_ROUTE_PATHS,
  APP_SHELL_ALIASES,
  APP_SHELL_FALLBACK_PATH,
  LEGACY_REDIRECTS,
} from '@app/core/constants/app-routes';
import { authGuard, landingGuard, noAuthGuard } from '@app/core/guards/auth.guard';

/**
 * Rotas lazy-loaded da aplicação.
 *
 *   `/`        → landing (login)
 *   `/login`   → alias → `/`
 *   `/app/*`   → shell protegido (dashboard, investimentos, …)
 */
export const routes: Routes = [
  // ── Landing / Login (público) ─────────────────────────────────────────────
  {
    path: '',
    pathMatch: 'full',
    title: `Entrar — ${APP_NAME}`,
    canActivate: [landingGuard],
    loadComponent: () =>
      import('./features/auth/pages/login-page/login-page.component').then(
        (m) => m.LoginPageComponent,
      ),
  },
  {
    path: 'login',
    canActivate: [noAuthGuard],
    pathMatch: 'full',
    redirectTo: '',
  },
  {
    path: 'bem-vindo',
    title: `Bem-vindo — ${APP_NAME}`,
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/auth/pages/welcome-page/welcome-page.component').then(
        (m) => m.WelcomePageComponent,
      ),
  },

  // ── Shell protegido ───────────────────────────────────────────────────────
  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/main-layout/main-layout.component').then((m) => m.MainLayoutComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: APP_ROUTE_PATHS.painel,
      },
      {
        path: APP_ROUTE_PATHS.painel,
        title: `${APP_NAME} — Dashboard de Finanças Pessoais`,
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard-page/dashboard-page.component').then(
            (m) => m.DashboardPageComponent,
          ),
      },
      {
        path: APP_ROUTE_PATHS.investimentos,
        title: `Investimentos — ${APP_NAME}`,
        loadComponent: () =>
          import(
            './features/investimentos/pages/investimentos-page/investimentos-page.component'
          ).then((m) => m.InvestimentosPageComponent),
      },
      {
        path: APP_ROUTE_PATHS.lancamentos,
        title: `Lançamentos — ${APP_NAME}`,
        loadComponent: () =>
          import('./features/lancamentos/pages/lancamentos-page/lancamentos-page.component').then(
            (m) => m.LancamentosPageComponent,
          ),
      },
      {
        path: APP_ROUTE_PATHS.categorias,
        title: `Categorias — ${APP_NAME}`,
        loadComponent: () =>
          import('./features/categorias/pages/categorias-page/categorias-page.component').then(
            (m) => m.CategoriasPageComponent,
          ),
      },
      {
        path: APP_ROUTE_PATHS.metas,
        title: `Metas — ${APP_NAME}`,
        loadComponent: () =>
          import('./features/metas/pages/metas-page/metas-page.component').then(
            (m) => m.MetasPageComponent,
          ),
      },
      {
        path: APP_ROUTE_PATHS.relatorios,
        title: `Relatórios — ${APP_NAME}`,
        loadComponent: () =>
          import('./features/relatorios/pages/relatorios-page/relatorios-page.component').then(
            (m) => m.RelatoriosPageComponent,
          ),
      },
      ...APP_SHELL_ALIASES.map(({ from, to }) => ({
        path: from,
        pathMatch: 'full' as const,
        redirectTo: to,
      })),
      {
        path: APP_ROUTE_PATHS.configuracoes,
        title: `Configurações — ${APP_NAME}`,
        loadComponent: () =>
          import('./features/ajustes/pages/ajustes-page/ajustes-page.component').then(
            (m) => m.AjustesPageComponent,
          ),
      },
      {
        path: '**',
        redirectTo: APP_SHELL_FALLBACK_PATH,
      },
    ],
  },

  // ── Atalhos legados (bookmarks antigos) ───────────────────────────────────
  ...LEGACY_REDIRECTS.map(({ path, redirectTo }) => ({
    path,
    redirectTo,
    pathMatch: 'full' as const,
  })),

  {
    path: 'erro-navegacao',
    title: `Erro — ${APP_NAME}`,
    loadComponent: () =>
      import('./layout/error-page/error-page.component').then((m) => m.ErrorPageComponent),
  },

  // ── Fallback ──────────────────────────────────────────────────────────────
  {
    path: '**',
    loadComponent: () =>
      import('./layout/not-found-page/not-found-page.component').then(
        (m) => m.NotFoundPageComponent,
      ),
  },
];

export { APP_HOME };
