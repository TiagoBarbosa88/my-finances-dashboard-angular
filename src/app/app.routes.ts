import { Routes } from '@angular/router';

import { APP_NAME } from '@app/core/constants/app-brand';
import { APP_HOME, authGuard, landingGuard, noAuthGuard } from '@app/core/guards/auth.guard';

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
        redirectTo: 'painel',
      },
      {
        path: 'painel',
        title: `${APP_NAME} — Dashboard de Finanças Pessoais`,
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard-page/dashboard-page.component').then(
            (m) => m.DashboardPageComponent,
          ),
      },
      {
        path: 'investimentos',
        title: `Investimentos — ${APP_NAME}`,
        loadComponent: () =>
          import(
            './features/investimentos/pages/investimentos-page/investimentos-page.component'
          ).then((m) => m.InvestimentosPageComponent),
      },
      {
        path: 'lancamentos',
        title: `Lançamentos — ${APP_NAME}`,
        loadComponent: () =>
          import('./features/lancamentos/pages/lancamentos-page/lancamentos-page.component').then(
            (m) => m.LancamentosPageComponent,
          ),
      },
      {
        path: 'categorias',
        title: `Categorias — ${APP_NAME}`,
        loadComponent: () =>
          import('./features/categorias/pages/categorias-page/categorias-page.component').then(
            (m) => m.CategoriasPageComponent,
          ),
      },
      {
        path: 'metas',
        title: `Metas — ${APP_NAME}`,
        loadComponent: () =>
          import('./features/metas/pages/metas-page/metas-page.component').then(
            (m) => m.MetasPageComponent,
          ),
      },
      {
        path: 'relatorios',
        title: `Relatórios — ${APP_NAME}`,
        loadComponent: () =>
          import('./features/relatorios/pages/relatorios-page/relatorios-page.component').then(
            (m) => m.RelatoriosPageComponent,
          ),
      },
      {
        path: 'ajustes',
        pathMatch: 'full',
        redirectTo: 'configuracoes',
      },
      {
        path: 'configuracoes',
        title: `Configurações — ${APP_NAME}`,
        loadComponent: () =>
          import('./features/ajustes/pages/ajustes-page/ajustes-page.component').then(
            (m) => m.AjustesPageComponent,
          ),
      },
    ],
  },

  // ── Atalhos legados (bookmarks antigos) ───────────────────────────────────
  { path: 'investimentos', redirectTo: 'app/investimentos', pathMatch: 'full' },
  { path: 'lancamentos', redirectTo: 'app/lancamentos', pathMatch: 'full' },
  { path: 'categorias', redirectTo: 'app/categorias', pathMatch: 'full' },
  { path: 'metas', redirectTo: 'app/metas', pathMatch: 'full' },
  { path: 'relatorios', redirectTo: 'app/relatorios', pathMatch: 'full' },
  { path: 'ajustes', redirectTo: 'app/configuracoes', pathMatch: 'full' },

  // ── Fallback ──────────────────────────────────────────────────────────────
  {
    path: '**',
    redirectTo: '',
  },
];

export { APP_HOME };

