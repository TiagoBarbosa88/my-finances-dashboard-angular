import { Component } from '@angular/core';

/**
 * Shell de duas colunas para todas as páginas de autenticação.
 *
 * Layout:
 *   [mobile]   → apenas o painel direito (formulário) ocupa a tela inteira
 *   [md+]      → painel esquerdo (branding) + painel direito (formulário)
 *
 * O conteúdo do formulário é projetado via <ng-content>.
 */
@Component({
  selector: 'app-auth-layout',
  standalone: true,
  templateUrl: './auth-layout.component.html',
})
export class AuthLayoutComponent {}
