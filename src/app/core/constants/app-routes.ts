/** Prefixo do shell autenticado (`/app/*`). */
export const APP_SHELL_PREFIX = 'app';

/** Dashboard principal (após login). */
export const APP_HOME = '/app/painel';

/** Paths canônicos das rotas filhas em `/app/*`. */
export const APP_ROUTE_PATHS = {
  painel: 'painel',
  investimentos: 'investimentos',
  lancamentos: 'lancamentos',
  categorias: 'categorias',
  metas: 'metas',
  relatorios: 'relatorios',
  configuracoes: 'configuracoes',
  /** Alias legado — redireciona para `configuracoes`. */
  ajustes: 'ajustes',
} as const;

export type AppRoutePathKey = keyof typeof APP_ROUTE_PATHS;
export type AppRoutePath = (typeof APP_ROUTE_PATHS)[AppRoutePathKey];

export type SidebarIcon =
  | 'dashboard'
  | 'chart'
  | 'wallet'
  | 'pie'
  | 'target'
  | 'trending'
  | 'settings';

export interface SidebarNavItem {
  title: string;
  /** Path relativo dentro de `/app`. */
  path: AppRoutePath;
  /** URL absoluta para RouterLink. */
  url: string;
  exact: boolean;
  icon: SidebarIcon;
  /** Itens ocultos temporariamente na nav. */
  visible?: boolean;
}

/** Monta URL absoluta do shell autenticado. */
export function appShellUrl(path: AppRoutePath): string {
  return `/${APP_SHELL_PREFIX}/${path}`;
}

/** URLs absolutas — derivadas dos paths canônicos. */
export const APP_ROUTE_URLS = {
  painel: appShellUrl(APP_ROUTE_PATHS.painel),
  investimentos: appShellUrl(APP_ROUTE_PATHS.investimentos),
  lancamentos: appShellUrl(APP_ROUTE_PATHS.lancamentos),
  categorias: appShellUrl(APP_ROUTE_PATHS.categorias),
  metas: appShellUrl(APP_ROUTE_PATHS.metas),
  relatorios: appShellUrl(APP_ROUTE_PATHS.relatorios),
  configuracoes: appShellUrl(APP_ROUTE_PATHS.configuracoes),
} as const;

/**
 * Itens visíveis na sidebar — única fonte de verdade para navegação principal.
 * Ao adicionar/renomear rota, altere apenas aqui + lazy-load em `app.routes.ts`.
 */
export const SIDEBAR_NAV_ITEMS: SidebarNavItem[] = [
  {
    title: 'Painel',
    path: APP_ROUTE_PATHS.painel,
    url: APP_ROUTE_URLS.painel,
    exact: true,
    icon: 'dashboard',
    visible: true,
  },
  {
    title: 'Investimentos',
    path: APP_ROUTE_PATHS.investimentos,
    url: APP_ROUTE_URLS.investimentos,
    exact: true,
    icon: 'chart',
    visible: true,
  },
  {
    title: 'Configurações',
    path: APP_ROUTE_PATHS.configuracoes,
    url: APP_ROUTE_URLS.configuracoes,
    exact: true,
    icon: 'settings',
    visible: true,
  },
];

/** Redirects internos dentro de `/app/*` (aliases). */
export const APP_SHELL_ALIASES: ReadonlyArray<{ from: AppRoutePath; to: AppRoutePath }> = [
  { from: APP_ROUTE_PATHS.ajustes, to: APP_ROUTE_PATHS.configuracoes },
];

/** Redirects legados na raiz (bookmarks antigos → `/app/*`). */
export const LEGACY_REDIRECTS: ReadonlyArray<{ path: string; redirectTo: string }> = [
  ...SIDEBAR_NAV_ITEMS.map((item) => ({
    path: item.path,
    redirectTo: `${APP_SHELL_PREFIX}/${item.path}`,
  })),
  { path: APP_ROUTE_PATHS.ajustes, redirectTo: `${APP_SHELL_PREFIX}/${APP_ROUTE_PATHS.configuracoes}` },
];

/** Default quando rota filha de `/app/*` não existe. */
export const APP_SHELL_FALLBACK_PATH = APP_ROUTE_PATHS.painel;
