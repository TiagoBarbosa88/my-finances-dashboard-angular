import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuthService } from '@app/core/services/auth.service';
import { TeamService } from '@app/core/services/team.service';
import { HasRoleDirective } from '@app/shared/directives/has-role.directive';
import {
  ROLE_LABELS,
  ROLE_OPTIONS,
  UserRole,
  Usuario,
} from '@app/shared/models/team.model';

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
  readonly conviteEmail = signal('');
  readonly conviteRole = signal<UserRole>('editor');

  readonly profileMessage = signal<string | null>(null);
  readonly conviteMessage = signal<string | null>(null);
  readonly profileSaving = signal(false);
  readonly conviteSending = signal(false);

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
      error: () => {
        this.profileMessage.set('Não foi possível salvar. Verifique o JSON Server.');
        this.profileSaving.set(false);
      },
    });
  }

  enviarConvite(): void {
    const email = this.conviteEmail().trim();

    if (!email || !email.includes('@')) {
      this.conviteMessage.set('Informe um e-mail válido.');
      return;
    }

    this.conviteSending.set(true);
    this.conviteMessage.set(null);

    this.team.enviarConvite(email, this.conviteRole()).subscribe({
      next: () => {
        this.conviteEmail.set('');
        this.conviteRole.set('editor');
        this.conviteMessage.set('Convite registrado com status pendente.');
        this.conviteSending.set(false);
      },
      error: () => {
        this.conviteMessage.set('Falha ao enviar convite. Verifique o JSON Server.');
        this.conviteSending.set(false);
      },
    });
  }

  removerMembro(membro: Usuario): void {
    if (membro.id === this.auth.usuarioLogado()?.id) {
      return;
    }

    this.team.removerMembro(membro.id).subscribe({
      error: () => console.error('[AjustesPage] removerMembro'),
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

  podeRemover(membro: Usuario): boolean {
    return membro.id !== this.auth.usuarioLogado()?.id;
  }
}
