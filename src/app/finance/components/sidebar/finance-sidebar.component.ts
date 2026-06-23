import { NgClass } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { APP_NAME } from '@app/core/constants/app-brand';
import { SupabaseService } from '@app/core/services/supabase.service';

interface NavItem {
  title: string;
  url: string;
  exact: boolean;
  icon: SidebarIcon;
  /** Itens ocultos temporariamente (Lançamentos → Relatórios). */
  visible?: boolean;
}

export type SidebarIcon =
  | 'dashboard'
  | 'chart'
  | 'wallet'
  | 'pie'
  | 'target'
  | 'trending'
  | 'settings';

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
  /** Rotas sincronizadas com app.routes.ts */
  readonly navItems: NavItem[] = [
    { title: 'Painel',        url: '/app/painel',        exact: true,  icon: 'dashboard', visible: true  },
    { title: 'Investimentos', url: '/app/investimentos', exact: true,  icon: 'chart',     visible: true  },
    // { title: 'Lançamentos',   url: '/lancamentos',    exact: true,  icon: 'wallet'    },
    // { title: 'Categorias',    url: '/categorias',     exact: true,  icon: 'pie'       },
    // { title: 'Metas',         url: '/metas',          exact: true,  icon: 'target'    },
    // { title: 'Relatórios',    url: '/relatorios',     exact: true,  icon: 'trending'  },
    { title: 'Ajustes',       url: '/app/ajustes',       exact: true,  icon: 'settings',  visible: true  },
  ];

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
