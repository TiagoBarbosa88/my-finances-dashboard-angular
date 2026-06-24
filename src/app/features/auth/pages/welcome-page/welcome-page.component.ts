import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { APP_NAME } from '@app/core/constants/app-brand';
import { APP_HOME } from '@app/core/guards/auth.guard';
import { AuthService } from '@app/core/services/auth.service';
import { SupabaseService } from '@app/core/services/supabase.service';
import { AuthLayoutComponent } from '@app/layout/auth-layout/auth-layout.component';

@Component({
  selector: 'app-welcome-page',
  standalone: true,
  imports: [FormsModule, AuthLayoutComponent],
  templateUrl: './welcome-page.component.html',
})
export class WelcomePageComponent {
  private readonly auth = inject(AuthService);
  private readonly supabase = inject(SupabaseService);
  private readonly router = inject(Router);

  readonly appName = APP_NAME;
  readonly nome = computed(() => this.auth.usuarioLogado()?.nome ?? 'Usuário');

  readonly password = signal('');
  readonly confirmPassword = signal('');
  readonly showPassword = signal(false);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);

  async savePasswordAndContinue(): Promise<void> {
    const pwd = this.password();
    const confirm = this.confirmPassword();

    if (pwd.length < 6) {
      this.error.set('Use pelo menos 6 caracteres na senha.');
      this.success.set(null);
      return;
    }

    if (pwd !== confirm) {
      this.error.set('As senhas não coincidem.');
      this.success.set(null);
      return;
    }

    if (!this.supabase.isConfigured()) {
      this.error.set('Serviço indisponível. Tente novamente em instantes.');
      return;
    }

    this.saving.set(true);
    this.error.set(null);
    this.success.set(null);

    try {
      const { error } = await this.supabase.setPassword(pwd);
      if (error) {
        this.error.set(this.translatePasswordError(error.message));
        return;
      }

      this.success.set('Senha definida! Redirecionando…');
      await this.router.navigateByUrl(APP_HOME);
    } catch {
      this.error.set('Não foi possível salvar a senha. Tente novamente.');
    } finally {
      this.saving.set(false);
    }
  }

  private translatePasswordError(msg: string): string {
    const lower = msg.toLowerCase();
    if (lower.includes('same password')) {
      return 'Escolha uma senha diferente da atual.';
    }
    if (lower.includes('weak') || lower.includes('at least')) {
      return 'Senha fraca. Use pelo menos 6 caracteres.';
    }
    return 'Não foi possível definir a senha. Tente novamente.';
  }
}
