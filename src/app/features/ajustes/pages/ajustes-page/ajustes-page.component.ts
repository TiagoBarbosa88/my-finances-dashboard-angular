import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuthService } from '@app/core/services/auth.service';
import { TeamService } from '@app/core/services/team.service';
import { HasRoleDirective } from '@app/shared/directives/has-role.directive';
import {
  Convite,
  ROLE_LABELS,
  ROLE_OPTIONS,
  UserRole,
  Usuario,
} from '@app/shared/models/team.model';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-ajustes-page',
  standalone: true,
  imports: [FormsModule, HasRoleDirective],
  templateUrl: './ajustes-page.component.html',
})
export class AjustesPageComponent implements OnInit {
  readonly auth = inject(AuthService);
  readonly team = inject(TeamService);

  readonly roleOptions = ROLE_OPTIONS;
  readonly roleLabels = ROLE_LABELS;

  readonly nome = signal('');
  readonly email = signal('');
  readonly conviteNome = signal('');
  readonly conviteEmail = signal('');
  readonly conviteRole = signal<UserRole>('editor');

  readonly profileMessage = signal<string | null>(null);
  readonly teamMessage = signal<string | null>(null);
  readonly conviteMessage = signal<string | null>(null);
  readonly profileSaving = signal(false);
  readonly conviteSending = signal(false);
  readonly conviteActionId = signal<number | null>(null);
  readonly membroActionId = signal<string | null>(null);
  readonly conviteEditEmail = signal<Record<number, string>>({});
  readonly membroRoleDraft = signal<Record<string, UserRole>>({});

  ngOnInit(): void {
    this.syncProfileFromAuth();
    this.team.loadMembros();
    this.team.loadConvites();
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
        this.profileMessage.set('Perfil atualizado com sucesso.');
        this.profileSaving.set(false);
      },
      error: (err: Error) => {
        this.profileMessage.set(err.message || 'Não foi possível salvar o perfil.');
        this.profileSaving.set(false);
      },
    });
  }

  enviarConvite(): void {
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

    this.team.enviarConvite(nome, email, this.conviteRole()).subscribe({
      next: () => {
        this.conviteNome.set('');
        this.conviteEmail.set('');
        this.conviteRole.set('editor');
        this.conviteMessage.set(
          environment.production
            ? `Convite enviado para ${nome}. Peça para verificar a caixa de entrada e o spam.`
            : 'Convite registrado com sucesso.',
        );
        this.conviteSending.set(false);
      },
      error: (err: Error) => {
        this.conviteMessage.set(err.message || 'Falha ao enviar convite.');
        this.conviteSending.set(false);
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

  removerConvite(convite: Convite): void {
    if (!confirm(`Remover convite para ${convite.nome}?`)) return;

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
            ? `E-mail reenviado para ${convite.nome}. Confira também a pasta de spam.`
            : 'Reenvio de e-mail indisponível neste ambiente.',
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

  removerMembro(membro: Usuario): void {
    if (membro.id === this.auth.usuarioLogado()?.id) {
      return;
    }

    if (!confirm(`Remover ${membro.nome} da equipe?`)) return;

    this.team.removerMembro(membro.id).subscribe({
      next: () => this.teamMessage.set(`${membro.nome} removido da equipe.`),
      error: (err: Error) => this.teamMessage.set(err.message || 'Falha ao remover membro.'),
    });
  }

  roleBadgeClass(role: UserRole): string {
    switch (role) {
      case 'admin':
        return 'bg-blue-500/15 text-blue-400 ring-blue-500/30';
      case 'editor':
        return 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30';
      default:
        return 'bg-muted text-muted-foreground ring-border';
    }
  }

  podeGerenciarMembro(membro: Usuario): boolean {
    return membro.id !== this.auth.usuarioLogado()?.id;
  }
}
