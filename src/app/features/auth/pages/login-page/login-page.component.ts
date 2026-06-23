import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { APP_NAME } from '@app/core/constants/app-brand';
import { APP_HOME } from '@app/core/guards/auth.guard';
import { AuthService } from '@app/core/services/auth.service';
import { FinanceService } from '@app/core/services/finance.service';
import { SupabaseService } from '@app/core/services/supabase.service';
import { AuthLayoutComponent } from '@app/layout/auth-layout/auth-layout.component';
import { environment } from 'src/environments/environment';

/**
 * Tela de login com e-mail + senha via Supabase Auth.
 */
@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [FormsModule, AuthLayoutComponent],
  templateUrl: './login-page.component.html',
})
export class LoginPageComponent implements OnInit {
  private readonly supabase = inject(SupabaseService);
  private readonly auth = inject(AuthService);
  private readonly finance = inject(FinanceService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly appName = APP_NAME;

  constructor() {
    if (environment.bypassAuth) {
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? APP_HOME;
      this.router.navigateByUrl(returnUrl);
    }
  }

  ngOnInit(): void {
    void this.handleAuthCallbackFromUrl();
  }

  readonly email = signal('');
  readonly password = signal('');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly showPassword = signal(false);

  async signIn(): Promise<void> {
    if (!this.email().trim() || !this.password()) {
      this.error.set('Preencha o e-mail e a senha.');
      return;
    }

    if (!this.supabase.isConfigured()) {
      this.error.set('Serviço de login indisponível no momento. Tente novamente mais tarde.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    try {
      const { data, error } = await this.supabase.signInWithEmail(
        this.email().trim(),
        this.password(),
      );

      if (error) {
        console.error('[LoginPage] signIn:', error.message, error);
        this.error.set(this.translateError(error.message));
        return;
      }

      if (!data.session) {
        this.error.set('Sessão não criada. Tente novamente.');
        return;
      }

    await this.auth.refreshProfileFromSupabase();
    this.finance.loadTransactions();
    this.finance.loadCarteiraAtivos();
    this.finance.loadInvestimentos();

      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? APP_HOME;
      await this.router.navigateByUrl(returnUrl);
    } catch (err) {
      console.error('[LoginPage] signIn unexpected:', err);
      this.error.set('Erro inesperado ao entrar. Tente novamente.');
    } finally {
      this.loading.set(false);
    }
  }

  /** Convite / magic link: Supabase devolve tokens no hash (#access_token=…). */
  private async handleAuthCallbackFromUrl(): Promise<void> {
    if (environment.bypassAuth || !this.supabase.isConfigured()) return;

    const hash = window.location.hash;
    if (!hash.includes('access_token=')) return;

    this.loading.set(true);
    this.error.set(null);

    try {
      // detectSessionInUrl processa o hash na inicialização do cliente
      await new Promise((resolve) => window.setTimeout(resolve, 0));
      const session = await this.supabase.getSession();

      if (!session) {
        this.error.set('Link de convite inválido ou expirado. Peça um novo convite.');
        return;
      }

      window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);

      await this.auth.refreshProfileFromSupabase();
      this.finance.loadTransactions();
      this.finance.loadCarteiraAtivos();
      this.finance.loadInvestimentos();

      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') ?? APP_HOME;
      await this.router.navigateByUrl(returnUrl);
    } catch (err) {
      console.error('[LoginPage] auth callback:', err);
      this.error.set('Não foi possível concluir o convite. Tente o link novamente ou peça reenvio.');
    } finally {
      this.loading.set(false);
    }
  }

  private translateError(msg: string): string {
    const lower = msg.toLowerCase();

    if (lower.includes('invalid login credentials') || lower.includes('invalid credentials')) {
      return 'E-mail ou senha incorretos.';
    }
    if (lower.includes('email not confirmed')) {
      return 'Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.';
    }
    if (lower.includes('too many requests')) {
      return 'Muitas tentativas. Aguarde alguns minutos.';
    }
    if (lower.includes('invalid api key') || lower.includes('invalid jwt')) {
      return 'Serviço temporariamente indisponível. Tente novamente mais tarde.';
    }
    if (lower.includes('failed to fetch') || lower.includes('network')) {
      return 'Falha de conexão. Verifique sua internet e tente novamente.';
    }

    return 'Não foi possível entrar. Verifique e-mail e senha e tente novamente.';
  }
}
