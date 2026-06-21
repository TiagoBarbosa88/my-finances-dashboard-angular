import { Routes } from '@angular/router';

import { authGuard, noAuthGuard } from '@app/core/guards/auth.guard';

/**
 * Rotas lazy-loaded da aplicação.
 *
 * Proteção:
 *   - Rota pai '' → `authGuard`  (redireciona para /login se não autenticado)
 *   - Rota /login → `noAuthGuard` (redireciona para / se já autenticado)
 */
export const routes: Routes = [
  // ── Rota de Login (pública) ──────────────────────────────────────────────
  {
    path: 'login',
    title: 'Entrar — My Finances',
    canActivate: [noAuthGuard],
    loadComponent: () =>
      import('./features/auth/pages/login-page/login-page.component').then(
        (m) => m.LoginPageComponent,
      ),
  },

  // ── Shell protegido (requer autenticação) ─────────────────────────────────
  {
    path: '',
    // canActivate: [authGuard],
    loadComponent: () =>
      import('./layout/main-layout/main-layout.component').then((m) => m.MainLayoutComponent),
    children: [
      {
        path: '',
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

  // ── Fallback 404 ─────────────────────────────────────────────────────────
  {
    path: '**',
    title: 'Página não encontrada — My Finances',
    loadComponent: () =>
      import('./layout/not-found-page/not-found-page.component').then(
        (m) => m.NotFoundPageComponent,
      ),
  },
];
