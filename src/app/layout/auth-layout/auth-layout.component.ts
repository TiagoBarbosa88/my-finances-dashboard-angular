import { NgClass } from '@angular/common';
import { Component, input, output } from '@angular/core';

import { APP_NAME } from '@app/core/constants/app-brand';

export type AuthMobileView = 'landing' | 'login';

/**
 * Shell de duas colunas para todas as páginas de autenticação.
 * No mobile: landing (branding) → login (formulário).
 */
@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [NgClass],
  templateUrl: './auth-layout.component.html',
})
export class AuthLayoutComponent {
  readonly appName = APP_NAME;

  /** Mobile: `landing` exibe branding; `login` exibe formulário. Desktop ignora e mostra ambos. */
  readonly mobileView = input<AuthMobileView>('landing');

  readonly mobileEnter = output<void>();
}
