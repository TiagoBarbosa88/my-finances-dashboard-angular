import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { Usuario, UserRole } from '@app/shared/models/team.model';
import { environment } from '../../../environments/environment';

/** Fallback para lançamentos legados sem `user_id`. */
export const CREATOR_NAME_TO_USER_ID: Record<string, number> = {
  Tiago:   1,
  Giselle: 2,
  Marina:  3,
};

export interface OwnableResource {
  user_id?: number;
  criado_por?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly usuariosUrl = `${environment.apiUrl}/usuarios`;

  /** Usuário autenticado no app (mock/JSON Server; futuro: Supabase). */
  readonly usuarioLogado = signal<Usuario | null>(null);

  readonly isAdmin = computed(() => this.usuarioLogado()?.role === 'admin');
  readonly isEditor = computed(() => this.usuarioLogado()?.role === 'editor');
  readonly isLeitor = computed(() => this.usuarioLogado()?.role === 'leitor');

  constructor() {
    this.loadSession();
  }

  loadSession(): void {
    this.http.get<Usuario[]>(this.usuariosUrl).subscribe({
      next: (users) => {
        const current = users.find((u) => u.id === 1) ?? users[0] ?? null;
        this.usuarioLogado.set(current);
      },
      error: () => {
        this.usuarioLogado.set({
          id: 1,
          nome: 'Tiago',
          email: 'tiago@email.com',
          role: 'admin',
        });
      },
    });
  }

  hasRole(role: string): boolean {
    const user = this.usuarioLogado();
    if (!user) return false;

    return user.role === role.toLowerCase() as UserRole;
  }

  hasAnyRole(roles: string[]): boolean {
    return roles.some((role) => this.hasRole(role));
  }

  /** Admin ou Editor — pode criar lançamentos/investimentos. */
  canCreate(): boolean {
    return this.hasAnyRole(['admin', 'editor']);
  }

  /** Leitor não altera; Editor só o próprio; Admin altera qualquer um. */
  canModify(resource: OwnableResource): boolean {
    const user = this.usuarioLogado();
    if (!user) return false;
    if (user.role === 'admin') return true;
    if (user.role === 'leitor') return false;

    return this.ownsResource(resource);
  }

  canDelete(resource: OwnableResource): boolean {
    return this.canModify(resource);
  }

  canManageInvestments(): boolean {
    return this.canCreate();
  }

  ownsResource(resource: OwnableResource): boolean {
    const user = this.usuarioLogado();
    if (!user) return false;

    if (resource.user_id != null) {
      return resource.user_id === user.id;
    }

    if (resource.criado_por) {
      return resource.criado_por === user.nome;
    }

    return false;
  }

  resolveUserId(criadoPor: string): number | undefined {
    return CREATOR_NAME_TO_USER_ID[criadoPor];
  }

  stampOwnership<T extends OwnableResource>(payload: T): T & { user_id: number; criado_por: string } {
    const user = this.usuarioLogado();
    if (!user) {
      throw new Error('Usuário não autenticado.');
    }

    return {
      ...payload,
      user_id: user.id,
      criado_por: payload.criado_por && payload.criado_por !== 'Você'
        ? payload.criado_por
        : user.nome,
    };
  }

  updateProfile(nome: string, email: string): Observable<Usuario> {
    const current = this.usuarioLogado();
    if (!current) {
      throw new Error('Nenhum usuário logado.');
    }

    const payload = { ...current, nome: nome.trim(), email: email.trim() };

    return this.http.put<Usuario>(`${this.usuariosUrl}/${current.id}`, payload).pipe(
      tap((saved) => this.usuarioLogado.set(saved)),
    );
  }
}
