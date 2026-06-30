import { NgClass } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { APP_NAME } from '@core/config/app-brand';
import { SIDEBAR_NAV_ITEMS, type SidebarIcon } from '@core/config/app-routes';
import { SupabaseService } from '@core/api/supabase.service';
import { AuthService } from '@core/auth/services/auth.service';

export type { SidebarIcon };

/**
 * Sidebar desktop (collapsible ao hover, 72 → 240 px)
 * + Mobile bottom nav (grid de 5 ícones).
 * Usa RouterLink + RouterLinkActive para navegação e estado ativo.
 */
@Component({
  selector: 'app-app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgClass],
  templateUrl: './app-sidebar.component.html',
})
export class AppSidebarComponent {
  private readonly auth = inject(AuthService);
  private readonly supabase = inject(SupabaseService);
  private readonly router = inject(Router);

  readonly appName = APP_NAME;

  /** Dados do usuário atual — exibidos no rodapé da sidebar. */
  readonly currentUser = this.supabase.currentUser;

  async signOut(): Promise<void> {
    await this.auth.signOut();
    await this.router.navigateByUrl('/', { replaceUrl: true });
  }

  /** Rotas sincronizadas com app.routes.ts via app-routes.ts */
  readonly navItems = SIDEBAR_NAV_ITEMS;

  readonly visibleNavItems = this.navItems.filter((item) => item.visible !== false);

  readonly mobileItems = this.visibleNavItems;

  /** Classes do link baseadas no estado ativo. */
  linkClass(isActive: boolean): string {
    return isActive
      ? 'finance-sidebar-link finance-sidebar-link--active'
      : 'finance-sidebar-link';
  }

  mobileLinkClass(isActive: boolean): string {
    return isActive
      ? 'finance-mobile-nav-link finance-mobile-nav-link--active'
      : 'finance-mobile-nav-link';
  }
}
