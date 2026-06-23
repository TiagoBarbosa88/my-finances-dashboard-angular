import { Routes } from '@angular/router';

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
    title: 'Entrar — My Finances',
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
        title: 'My Finances — Dashboard de Finanças Pessoais',
        loadComponent: () =>
          import('./features/dashboard/pages/dashboard-page/dashboard-page.component').then(
            (m) => m.DashboardPageComponent,
          ),
      },
      {
        path: 'investimentos',
        title: 'Investimentos — My Finances',
        loadComponent: () =>
          import(
            './features/investimentos/pages/investimentos-page/investimentos-page.component'
          ).then((m) => m.InvestimentosPageComponent),
      },
      {
        path: 'lancamentos',
        title: 'Lançamentos — My Finances',
        loadComponent: () =>
          import('./features/lancamentos/pages/lancamentos-page/lancamentos-page.component').then(
            (m) => m.LancamentosPageComponent,
          ),
      },
      {
        path: 'categorias',
        title: 'Categorias — My Finances',
        loadComponent: () =>
          import('./features/categorias/pages/categorias-page/categorias-page.component').then(
            (m) => m.CategoriasPageComponent,
          ),
      },
      {
        path: 'metas',
        title: 'Metas — My Finances',
        loadComponent: () =>
          import('./features/metas/pages/metas-page/metas-page.component').then(
            (m) => m.MetasPageComponent,
          ),
      },
      {
        path: 'relatorios',
        title: 'Relatórios — My Finances',
        loadComponent: () =>
          import('./features/relatorios/pages/relatorios-page/relatorios-page.component').then(
            (m) => m.RelatoriosPageComponent,
          ),
      },
      {
        path: 'ajustes',
        title: 'Ajustes — My Finances',
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
  { path: 'ajustes', redirectTo: 'app/ajustes', pathMatch: 'full' },

  // ── Fallback ──────────────────────────────────────────────────────────────
  {
    path: '**',
    redirectTo: '',
  },
];

export { APP_HOME };
