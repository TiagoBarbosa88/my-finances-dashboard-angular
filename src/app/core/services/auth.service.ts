import { HttpClient } from '@angular/common/http';

import { computed, inject, Injectable, signal } from '@angular/core';

import { from, Observable, tap } from 'rxjs';



import { SupabaseService } from '@app/core/services/supabase.service';

import { Usuario, UserRole } from '@app/shared/models/team.model';

import { environment } from '../../../environments/environment';



/** Fallback para lançamentos legados sem `user_id` (JSON Server). */

export const CREATOR_NAME_TO_USER_ID: Record<string, number> = {

  Tiago:   1,

  Giselle: 2,

  Marina:  3,

};



export interface OwnableResource {

  user_id?: string | number;

  criado_por?: string;

}



@Injectable({ providedIn: 'root' })

export class AuthService {

  private readonly http = inject(HttpClient);

  private readonly supabase = inject(SupabaseService);

  private readonly usuariosUrl = `${environment.apiUrl}/usuarios`;



  /** Usuário autenticado no app — perfil Supabase ou mock JSON Server. */

  readonly usuarioLogado = signal<Usuario | null>(null);



  readonly isAdmin = computed(() => this.usuarioLogado()?.role === 'admin');

  readonly isEditor = computed(() => this.usuarioLogado()?.role === 'editor');

  readonly isLeitor = computed(() => this.usuarioLogado()?.role === 'leitor');



  constructor() {

    void this.loadSession();



    if (this.supabase.isConfigured()) {

      this.supabase.client.auth.onAuthStateChange((_event, session) => {

        if (session?.user) {

          void this.refreshProfileFromSupabase();

        } else {

          this.usuarioLogado.set(null);

        }

      });

    }

  }



  async loadSession(): Promise<void> {

    if (this.supabase.isConfigured()) {

      const session = await this.supabase.getSession();

      if (session?.user) {

        await this.refreshProfileFromSupabase();

        return;

      }

    }



    this.loadSessionFromJson();

  }



  /** Carrega o perfil do usuário logado a partir da tabela `profiles`. */

  async refreshProfileFromSupabase(): Promise<void> {

    const user = await this.supabase.getUser();

    if (!user) {

      this.usuarioLogado.set(null);

      return;

    }



    const profile = await this.supabase.fetchProfile(user.id);

    if (profile) {

      this.usuarioLogado.set(profile);

      return;

    }



    console.warn('[AuthService] profile não encontrado — usando fallback leitor.');

    this.usuarioLogado.set({

      id: user.id,

      nome: user.user_metadata?.['full_name'] ?? user.email?.split('@')[0] ?? 'Usuário',

      email: user.email ?? '',

      role: 'leitor',

    });

  }



  private loadSessionFromJson(): void {

    if (environment.bypassAuth) {

      this.http.get<Usuario[]>(this.usuariosUrl).subscribe({

        next: (users) => {

          const normalized = users.map((u) => ({ ...u, id: String(u.id) }));

          const current = normalized.find((u) => u.id === '1') ?? normalized[0] ?? null;

          this.usuarioLogado.set(current);

        },

        error: () => {

          this.usuarioLogado.set({

            id: '1',

            nome: 'Tiago',

            email: 'tiago@email.com',

            role: 'admin',

          });

        },

      });

      return;

    }



    this.usuarioLogado.set(null);

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

      return String(resource.user_id) === String(user.id);

    }



    if (resource.criado_por) {

      return resource.criado_por === user.nome;

    }



    return false;

  }



  resolveUserId(criadoPor: string): number | undefined {

    return CREATOR_NAME_TO_USER_ID[criadoPor];

  }



  stampOwnership<T extends OwnableResource>(

    payload: T,

  ): T & { user_id: string | number; criado_por: string } {

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



    if (this.supabase.isConfigured()) {

      return from(this.updateProfileSupabase(current.id, nome, email)).pipe(

        tap((saved) => {

          if (saved) this.usuarioLogado.set(saved);

        }),

      );

    }



    const payload = { ...current, nome: nome.trim(), email: email.trim() };



    return this.http.put<Usuario>(`${this.usuariosUrl}/${current.id}`, payload).pipe(

      tap((saved) => this.usuarioLogado.set({ ...saved, id: String(saved.id) })),

    );

  }



  private async updateProfileSupabase(

    userId: string,

    nome: string,

    email: string,

  ): Promise<Usuario> {

    const trimmedEmail = email.trim();

    const saved = await this.supabase.updateProfile(userId, nome, trimmedEmail);



    if (!saved) {

      throw new Error('Falha ao atualizar perfil no Supabase.');

    }



    const current = this.usuarioLogado();

    if (current && trimmedEmail !== current.email) {

      const { error } = await this.supabase.client.auth.updateUser({ email: trimmedEmail });

      if (error) {

        console.warn('[AuthService] auth.updateUser email:', error.message);

      }

    }



    return saved;

  }

}


