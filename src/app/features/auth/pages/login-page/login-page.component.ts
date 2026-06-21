import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { SupabaseService } from '@app/core/services/supabase.service';
import { AuthLayoutComponent } from '@app/layout/auth-layout/auth-layout.component';
import { environment } from 'src/environments/environment';

/**
 * Tela de login com e-mail + senha via Supabase Auth.
 *
 * Fluxo:
 *   1. Usuário submete o formulário.
 *   2. `signIn()` chama `supabase.signInWithEmail()`.
 *   3. Sucesso → navega para `returnUrl` (ou `/` como fallback).
 *   4. Erro    → exibe mensagem traduzida, mantém a tela aberta.
 *
 * Dev mode: quando `environment.bypassAuth = true`, redireciona
 * imediatamente para o dashboard sem exigir credenciais.
 */
@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [FormsModule, AuthLayoutComponent],
  templateUrl: './login-page.component.html',
})
export class LoginPageComponent {
  private readonly supabase = inject(SupabaseService);
  private readonly router   = inject(Router);
  private readonly route    = inject(ActivatedRoute);

  constructor() {
    // Em modo dev (bypassAuth), pula o login e vai direto ao dashboard.
    if (environment.bypassAuth) {
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/';
      this.router.navigateByUrl(returnUrl);
    }
  }

  readonly email    = signal('');
  readonly password = signal('');
  readonly loading  = signal(false);
  readonly error    = signal<string | null>(null);

  /** Controla visibilidade do campo de senha. */
  readonly showPassword = signal(false);

  async signIn(): Promise<void> {
    if (!this.email().trim() || !this.password()) {
      this.error.set('Preencha o e-mail e a senha.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    const { error } = await this.supabase.signInWithEmail(
      this.email().trim(),
      this.password(),
    );

    if (error) {
      this.error.set(this.translateError(error.message));
      this.loading.set(false);
      return;
    }

    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/';
    this.router.navigateByUrl(returnUrl);
  }

  private translateError(msg: string): string {
    if (msg.includes('Invalid login credentials')) return 'E-mail ou senha incorretos.';
    if (msg.includes('Email not confirmed'))        return 'Confirme seu e-mail antes de entrar.';
    if (msg.includes('Too many requests'))          return 'Muitas tentativas. Aguarde alguns minutos.';
    return 'Erro ao entrar. Tente novamente.';
  }
}
