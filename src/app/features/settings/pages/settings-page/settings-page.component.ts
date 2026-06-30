import { Component, computed, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '@core/auth/services/auth.service';
import { SupabaseService } from '@core/api/supabase.service';
import { TeamService } from '@core/api/team.service';
import { HasRoleDirective } from '@shared/directives/has-role.directive';
import {
  Convite,
  ROLE_LABELS,
  ROLE_OPTIONS,
  UserRole,
  Usuario,
} from '@shared/models/team.model';
import { ConfirmDialogComponent } from '@shared/ui/confirm-dialog/confirm-dialog.component';
import { userFacingMessage } from '@core/utils/user-message.util';
import { environment } from 'src/environments/environment';

type ConfirmTarget =
  | { kind: 'convite'; convite: Convite }
  | { kind: 'membro'; membro: Usuario };

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [FormsModule, HasRoleDirective, ConfirmDialogComponent],
  templateUrl: './settings-page.component.html',
})
export class SettingsPageComponent implements OnInit, OnDestroy {
  readonly auth = inject(AuthService);
  readonly supabase = inject(SupabaseService);
  readonly team = inject(TeamService);
  private readonly router = inject(Router);

  private cooldownTimer: ReturnType<typeof setInterval> | null = null;

  readonly roleOptions = ROLE_OPTIONS;
  readonly roleLabels = ROLE_LABELS;

  readonly nome = signal('');
  readonly email = signal('');
  readonly newPassword = signal('');
  readonly confirmPassword = signal('');
  readonly showNewPassword = signal(false);
  readonly passwordFormOpen = signal(false);
  readonly conviteNome = signal('');
  readonly conviteEmail = signal('');
  readonly conviteRole = signal<UserRole>('editor');

  readonly profileMessage = signal<string | null>(null);
  readonly passwordMessage = signal<string | null>(null);
  readonly teamMessage = signal<string | null>(null);
  readonly conviteMessage = signal<string | null>(null);
  readonly profileSaving = signal(false);
  readonly passwordSaving = signal(false);
  readonly conviteSending = signal(false);
  readonly conviteCooldownUntil = signal(0);
  readonly conviteCooldownTick = signal(0);
  readonly conviteActionId = signal<number | null>(null);
  readonly membroActionId = signal<string | null>(null);
  readonly conviteEditEmail = signal<Record<number, string>>({});
  readonly membroRoleDraft = signal<Record<string, UserRole>>({});
  readonly confirmTarget = signal<ConfirmTarget | null>(null);

  readonly convitesPendentes = computed(() =>
    this.team.convites().filter((c) => c.status === 'pendente'),
  );

  readonly conviteCooldownSec = computed(() => {
    this.conviteCooldownTick();
    const remain = Math.ceil((this.conviteCooldownUntil() - Date.now()) / 1000);
    return remain > 0 ? remain : 0;
  });

  readonly conviteButtonDisabled = computed(
    () => this.conviteSending() || this.conviteCooldownSec() > 0,
  );

  readonly usuarioAtual = computed(() => {
    const authUser = this.auth.usuarioLogado();
    if (!authUser) return null;
    return this.team.membros().find((m) => m.id === authUser.id) ?? authUser;
  });

  readonly outrosMembros = computed(() => {
    const id = this.auth.usuarioLogado()?.id;
    return this.team.membros().filter((m) => m.id !== id);
  });

  readonly totalMembros = computed(() => this.team.membros().length);

  readonly canChangePassword = computed(() => this.supabase.isConfigured() && !environment.bypassAuth);

  readonly canSignOut = computed(() => this.supabase.isConfigured());

  readonly confirmTitle = computed(() => {
    const target = this.confirmTarget();
    if (!target) return '';
    if (target.kind === 'convite') return 'Remover convite?';
    return 'Remover membro?';
  });

  readonly confirmMessage = computed(() => {
    const target = this.confirmTarget();
    if (!target) return '';
    if (target.kind === 'convite') {
      return `O convite para ${target.convite.nome} (${target.convite.email}) será cancelado.`;
    }
    return `${target.membro.nome} perderá o acesso ao Smart Finances.`;
  });

  ngOnInit(): void {
    this.syncProfileFromAuth();
    this.team.loadMembros();
    this.team.loadConvites();
  }

  ngOnDestroy(): void {
    if (this.cooldownTimer) {
      clearInterval(this.cooldownTimer);
    }
  }

  private armConviteCooldown(durationMs: number): void {
    this.conviteCooldownUntil.set(Date.now() + durationMs);

    if (this.cooldownTimer) {
      clearInterval(this.cooldownTimer);
    }

    this.cooldownTimer = setInterval(() => {
      if (this.conviteCooldownSec() <= 0) {
        clearInterval(this.cooldownTimer!);
        this.cooldownTimer = null;
        this.conviteCooldownUntil.set(0);
      }
      this.conviteCooldownTick.update((n) => n + 1);
    }, 1000);
  }

  syncProfileFromAuth(): void {
    const user = this.auth.usuarioLogado();
    if (!user) return;

    this.nome.set(user.nome);
    this.email.set(user.email);
  }

  salvarPerfil(): void {
    const nome = this.nome().trim();
    const email = this.email().trim();

    if (!nome || !email) {
      this.profileMessage.set('Preencha nome e e-mail.');
      return;
    }

    this.profileSaving.set(true);
    this.profileMessage.set(null);

    this.auth.updateProfile(nome, email).subscribe({
      next: () => {
        const updated = this.auth.usuarioLogado();
        if (updated) {
          this.team.syncMembroProfile(updated);
        }
        this.profileMessage.set('Perfil atualizado com sucesso.');
        this.profileSaving.set(false);
      },
      error: (err: Error) => {
        this.profileMessage.set(err.message || 'Não foi possível salvar o perfil.');
        this.profileSaving.set(false);
      },
    });
  }

  abrirFormularioSenha(): void {
    this.passwordFormOpen.set(true);
    this.passwordMessage.set(null);
  }

  fecharFormularioSenha(): void {
    this.passwordFormOpen.set(false);
    this.newPassword.set('');
    this.confirmPassword.set('');
    this.showNewPassword.set(false);
    this.passwordMessage.set(null);
  }

  async alterarSenha(): Promise<void> {
    const pwd = this.newPassword();
    const confirm = this.confirmPassword();

    if (pwd.length < 6) {
      this.passwordMessage.set('Use pelo menos 6 caracteres na nova senha.');
      return;
    }

    if (pwd !== confirm) {
      this.passwordMessage.set('As senhas não coincidem.');
      return;
    }

    if (!this.supabase.isConfigured()) {
      this.passwordMessage.set('Alteração de senha indisponível no momento.');
      return;
    }

    this.passwordSaving.set(true);
    this.passwordMessage.set(null);

    try {
      const { error } = await this.supabase.setPassword(pwd);
      if (error) {
        this.passwordMessage.set(this.translatePasswordError(error.message));
        return;
      }

      this.newPassword.set('');
      this.confirmPassword.set('');
      this.passwordMessage.set('Senha alterada com sucesso.');
      this.passwordFormOpen.set(false);
      this.showNewPassword.set(false);
    } catch {
      this.passwordMessage.set('Não foi possível alterar a senha. Tente novamente.');
    } finally {
      this.passwordSaving.set(false);
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
    return 'Não foi possível alterar a senha. Tente novamente.';
  }

  enviarConvite(): void {
    const cooldown = this.conviteCooldownSec();
    if (cooldown > 0) {
      this.conviteMessage.set(`Aguarde ${cooldown}s antes de enviar outro convite.`);
      return;
    }

    const nome = this.conviteNome().trim();
    const email = this.conviteEmail().trim();

    if (!nome) {
      this.conviteMessage.set('Informe o nome da pessoa.');
      return;
    }

    if (!email || !email.includes('@')) {
      this.conviteMessage.set('Informe um e-mail válido.');
      return;
    }

    this.conviteSending.set(true);
    this.conviteMessage.set(null);
    this.armConviteCooldown(30_000);

    this.team.enviarConvite(nome, email, this.conviteRole()).subscribe({
      next: () => {
        this.conviteNome.set('');
        this.conviteEmail.set('');
        this.conviteRole.set('editor');
        this.conviteMessage.set(
          environment.production
            ? `Convite enviado para ${nome}. Peça para a pessoa verificar o e-mail.`
            : `Convite registrado para ${nome}.`,
        );
        this.conviteSending.set(false);
        this.armConviteCooldown(60_000);
      },
      error: (err: Error) => {
        const message = userFacingMessage(err.message, 'Falha ao enviar convite.');
        this.conviteMessage.set(message);
        this.conviteSending.set(false);

        const lower = message.toLowerCase();
        if (lower.includes('aguarde') || lower.includes('limite')) {
          this.armConviteCooldown(120_000);
        }
      },
    });
  }

  atualizarRoleConvite(convite: Convite, role: UserRole): void {
    if (convite.role === role) return;

    this.conviteActionId.set(convite.id);
    this.conviteMessage.set(null);

    this.team.atualizarConvite(convite.id, { role }).subscribe({
      next: () => {
        this.conviteMessage.set('Permissão do convite atualizada.');
        this.conviteActionId.set(null);
      },
      error: (err: Error) => {
        this.conviteMessage.set(err.message || 'Falha ao atualizar convite.');
        this.conviteActionId.set(null);
      },
    });
  }

  conviteEmailAtual(convite: Convite): string {
    return this.conviteEditEmail()[convite.id] ?? convite.email;
  }

  setConviteEditEmail(conviteId: number, email: string): void {
    this.conviteEditEmail.update((map) => ({ ...map, [conviteId]: email }));
  }

  emailConviteAlterado(convite: Convite): boolean {
    const draft = this.conviteEmailAtual(convite).trim().toLowerCase();
    return draft !== convite.email && draft.includes('@');
  }

  salvarEmailConvite(convite: Convite): void {
    const email = this.conviteEmailAtual(convite).trim().toLowerCase();

    if (!email.includes('@')) {
      this.conviteMessage.set('Informe um e-mail válido.');
      return;
    }

    if (email === convite.email) {
      this.conviteMessage.set('O e-mail não foi alterado.');
      return;
    }

    this.conviteActionId.set(convite.id);
    this.conviteMessage.set(null);

    this.team.atualizarConvite(convite.id, { email }).subscribe({
      next: () => {
        this.conviteEditEmail.update((map) => {
          const next = { ...map };
          delete next[convite.id];
          return next;
        });
        this.conviteMessage.set(
          environment.production
            ? 'E-mail atualizado e convite reenviado para o novo endereço.'
            : 'E-mail do convite atualizado.',
        );
        this.conviteActionId.set(null);
      },
      error: (err: Error) => {
        this.conviteMessage.set(err.message || 'Falha ao atualizar e-mail.');
        this.conviteActionId.set(null);
      },
    });
  }

  solicitarRemoverConvite(convite: Convite): void {
    this.confirmTarget.set({ kind: 'convite', convite });
  }

  solicitarRemoverMembro(membro: Usuario): void {
    this.confirmTarget.set({ kind: 'membro', membro });
  }

  cancelarConfirmacao(): void {
    this.confirmTarget.set(null);
  }

  executarConfirmacao(): void {
    const target = this.confirmTarget();
    if (!target) return;

    this.confirmTarget.set(null);

    if (target.kind === 'convite') {
      this.executarRemoverConvite(target.convite);
      return;
    }

    this.executarRemoverMembro(target.membro);
  }

  private executarRemoverConvite(convite: Convite): void {
    this.conviteActionId.set(convite.id);
    this.conviteMessage.set(null);

    this.team.removerConvite(convite.id).subscribe({
      next: () => {
        this.conviteMessage.set('Convite removido. Você pode enviar um novo convite.');
        this.conviteActionId.set(null);
      },
      error: (err: Error) => {
        this.conviteMessage.set(err.message || 'Falha ao remover convite.');
        this.conviteActionId.set(null);
      },
    });
  }

  reenviarConvite(convite: Convite): void {
    this.conviteActionId.set(convite.id);
    this.conviteMessage.set(null);

    this.team.reenviarConvite(convite.id).subscribe({
      next: () => {
        this.conviteMessage.set(
          environment.production
            ? `E-mail reenviado para ${convite.nome}.`
            : 'Não foi possível reenviar o e-mail agora.',
        );
        this.conviteActionId.set(null);
      },
      error: (err: Error) => {
        this.conviteMessage.set(err.message || 'Falha ao reenviar convite.');
        this.conviteActionId.set(null);
      },
    });
  }

  conviteBusy(conviteId: number): boolean {
    return this.conviteActionId() === conviteId;
  }

  membroRoleAtual(membro: Usuario): UserRole {
    return this.membroRoleDraft()[membro.id] ?? membro.role;
  }

  setMembroRoleDraft(membroId: string, role: UserRole): void {
    this.membroRoleDraft.update((map) => ({ ...map, [membroId]: role }));
  }

  roleMembroAlterado(membro: Usuario): boolean {
    return this.membroRoleAtual(membro) !== membro.role;
  }

  atualizarMembroRole(membro: Usuario): void {
    const role = this.membroRoleAtual(membro);

    this.membroActionId.set(membro.id);
    this.teamMessage.set(null);

    this.team.atualizarMembroRole(membro.id, role).subscribe({
      next: () => {
        this.membroRoleDraft.update((map) => {
          const next = { ...map };
          delete next[membro.id];
          return next;
        });
        this.teamMessage.set(`Permissão de ${membro.nome} atualizada.`);
        this.membroActionId.set(null);
      },
      error: (err: Error) => {
        this.teamMessage.set(err.message || 'Falha ao atualizar permissão.');
        this.membroActionId.set(null);
      },
    });
  }

  membroBusy(membroId: string): boolean {
    return this.membroActionId() === membroId;
  }

  private executarRemoverMembro(membro: Usuario): void {
    if (membro.id === this.auth.usuarioLogado()?.id) return;

    this.membroActionId.set(membro.id);
    this.teamMessage.set(null);

    this.team.removerMembro(membro.id).subscribe({
      next: () => {
        this.teamMessage.set(`${membro.nome} removido da equipe.`);
        this.membroActionId.set(null);
      },
      error: (err: Error) => {
        this.teamMessage.set(err.message || 'Falha ao remover membro.');
        this.membroActionId.set(null);
      },
    });
  }

  async signOut(): Promise<void> {
    await this.supabase.signOut();
    await this.router.navigate(['/']);
  }

  roleBadgeClass(role: UserRole): string {
    switch (role) {
      case 'admin':
        return 'bg-primary/15 text-primary ring-primary/30';
      case 'editor':
        return 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30';
      default:
        return 'bg-muted text-muted-foreground ring-border';
    }
  }
}
