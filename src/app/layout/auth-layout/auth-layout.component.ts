import { Component } from '@angular/core';

import { APP_NAME } from '@app/core/constants/app-brand';

/**
 * Shell de duas colunas para todas as páginas de autenticação.
 */
@Component({
  selector: 'app-auth-layout',
  standalone: true,
  templateUrl: './auth-layout.component.html',
})
export class AuthLayoutComponent {
  readonly appName = APP_NAME;
}
