import { NgClass } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { SupabaseService } from '@app/core/services/supabase.service';

interface NavItem {
  title: string;
  url: string;
  exact: boolean;
  icon: SidebarIcon;
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
  private readonly router   = inject(Router);

  /** Dados do usuário atual — exibidos no rodapé da sidebar. */
  readonly currentUser = this.supabase.currentUser;

  async signOut(): Promise<void> {
    await this.supabase.signOut();
    this.router.navigate(['/login']);
  }
  /** Rotas sincronizadas com app.routes.ts */
  readonly navItems: NavItem[] = [
    { title: 'Painel',        url: '/',              exact: true,  icon: 'dashboard' },
    { title: 'Investimentos', url: '/investimentos',  exact: true,  icon: 'chart'     },
    { title: 'Lançamentos',   url: '/lancamentos',    exact: true,  icon: 'wallet'    },
    { title: 'Categorias',    url: '/categorias',     exact: true,  icon: 'pie'       },
    { title: 'Metas',         url: '/metas',          exact: true,  icon: 'target'    },
    { title: 'Relatórios',    url: '/relatorios',     exact: true,  icon: 'trending'  },
    { title: 'Ajustes',       url: '/ajustes',        exact: true,  icon: 'settings'  },
  ];

  readonly mobileItems = this.navItems.slice(0, 5);

  /** Classes do link baseadas no estado ativo. */
  linkClass(isActive: boolean): string {
    const base =
      'group/item relative flex h-11 items-center gap-3 overflow-hidden rounded-xl px-3 text-sm font-medium transition-colors';
    return isActive
      ? `${base} bg-accent text-foreground`
      : `${base} text-muted-foreground hover:bg-accent/60 hover:text-foreground`;
  }

  mobileLinkClass(isActive: boolean): string {
    const base = 'flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs transition-colors';
    return isActive ? `${base} text-primary` : `${base} text-muted-foreground`;
  }
}
