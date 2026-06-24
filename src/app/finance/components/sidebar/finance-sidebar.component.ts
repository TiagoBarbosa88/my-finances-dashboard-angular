import { NgClass } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { APP_NAME } from '@app/core/constants/app-brand';
import { SIDEBAR_NAV_ITEMS, type SidebarIcon } from '@app/core/constants/app-routes';
import { SupabaseService } from '@app/core/services/supabase.service';

export type { SidebarIcon };

/**
 * Sidebar desktop (collapsible ao hover, 72 → 240 px)
 * + Mobile bottom nav (grid de 5 ícones).
 * Usa RouterLink + RouterLinkActive para navegação e estado ativo.
 */
@Component({
  selector: 'app-finance-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgClass],
  templateUrl: './finance-sidebar.component.html',
})
export class FinanceSidebarComponent {
  private readonly supabase = inject(SupabaseService);
  private readonly router = inject(Router);

  readonly appName = APP_NAME;

  /** Dados do usuário atual — exibidos no rodapé da sidebar. */
  readonly currentUser = this.supabase.currentUser;

  async signOut(): Promise<void> {
    await this.supabase.signOut();
    this.router.navigate(['/']);
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
