import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

import { APP_NAME } from '@app/core/constants/app-brand';
import { APP_HOME } from '@app/core/guards/auth.guard';
import { AuthService } from '@app/core/services/auth.service';
import { AuthLayoutComponent } from '@app/layout/auth-layout/auth-layout.component';

@Component({
  selector: 'app-welcome-page',
  standalone: true,
  imports: [AuthLayoutComponent],
  templateUrl: './welcome-page.component.html',
})
export class WelcomePageComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly appName = APP_NAME;
  readonly nome = computed(() => this.auth.usuarioLogado()?.nome ?? 'Usuário');

  goToApp(): void {
    void this.router.navigateByUrl(APP_HOME);
  }
}
