import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';

import { routes } from './app.routes';
import { SIDEBAR_NAV_ITEMS } from '@core/config/app-routes';

describe('app routes contract', () => {
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter(routes)],
    }).compileComponents();

    router = TestBed.inject(Router);
  });

  it('should resolve every sidebar URL to a valid route', () => {
    for (const item of SIDEBAR_NAV_ITEMS) {
      const tree: UrlTree | null = router.parseUrl(item.url);
      expect(tree).withContext(`parseUrl failed for ${item.url}`).not.toBeNull();

      const serialized = router.serializeUrl(tree!);
      expect(serialized).toBe(item.url);
    }
  });

  it('should include configuracoes in app shell children', () => {
    const appRoute = routes.find((r) => r.path === 'app');
    expect(appRoute).toBeDefined();

    const childPaths = (appRoute!.children ?? []).map((c) => c.path);
    expect(childPaths).toContain('configuracoes');
  });

  it('should redirect legacy ajustes to configuracoes', () => {
    const legacy = routes.find((r) => r.path === 'ajustes' && r.redirectTo === 'app/configuracoes');
    expect(legacy).toBeDefined();
  });

  it('should redirect legacy configuracoes root path to app shell', () => {
    const legacy = routes.find(
      (r) => r.path === 'configuracoes' && r.redirectTo === 'app/configuracoes',
    );
    expect(legacy).toBeDefined();
  });

  it('should have app shell fallback for unknown child routes', () => {
    const appRoute = routes.find((r) => r.path === 'app');
    const fallback = (appRoute!.children ?? []).find((c) => c.path === '**');
    expect(fallback?.redirectTo).toBe('painel');
  });
});
