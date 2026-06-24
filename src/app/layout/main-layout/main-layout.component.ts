import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FinanceSidebarComponent } from '../../finance/components/sidebar/finance-sidebar.component';
import { PwaInstallBannerComponent } from '@app/shared/ui/pwa-install-banner/pwa-install-banner.component';

/**
 * Shell raiz da aplicação.
 * Monta a sidebar (desktop + mobile) e delimita a área de conteúdo principal,
 * adicionando o padding lateral/superior que afasta o conteúdo das bordas.
 */
@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, FinanceSidebarComponent, PwaInstallBannerComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css',
})
export class MainLayoutComponent {}
