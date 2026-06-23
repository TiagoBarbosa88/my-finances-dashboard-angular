import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { from, Observable, tap } from 'rxjs';

import { AuthService } from '@app/core/services/auth.service';
import { SupabaseService } from '@app/core/services/supabase.service';
import { Convite, ConviteDraft, Usuario } from '@app/shared/models/team.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TeamService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly supabase = inject(SupabaseService);

  private readonly usuariosUrl = `${environment.apiUrl}/usuarios`;
  private readonly convitesUrl = `${environment.apiUrl}/convites`;

  readonly membros = signal<Usuario[]>([]);
  readonly convites = signal<Convite[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);

  loadMembros(): void {
    this.loading.set(true);

    if (this.supabase.isConfigured()) {
      void this.supabase.fetchProfiles().then((data) => {
        this.membros.set(data);
        this.loading.set(false);
      });
      return;
    }

    this.http.get<Usuario[]>(this.usuariosUrl).subscribe({
      next: (data) => this.membros.set(data.map((u) => ({ ...u, id: String(u.id) }))),
      error: () => this.loading.set(false),
      complete: () => this.loading.set(false),
    });
  }

  loadConvites(): void {
    if (this.supabase.isConfigured()) {
      void this.supabase.fetchConvites().then((data) => this.convites.set(data));
      return;
    }

    this.http.get<Convite[]>(this.convitesUrl).subscribe({
      next: (data) => this.convites.set(data),
      error: () => this.convites.set([]),
    });
  }

  enviarConvite(email: string, role: ConviteDraft['role']): Observable<Convite> {
    const convidadoPor = this.auth.usuarioLogado()?.nome ?? 'Admin';
    const draft: ConviteDraft = {
      email: email.trim().toLowerCase(),
      role,
      status: 'pendente',
      criado_em: new Date().toISOString().split('T')[0],
      convidado_por: convidadoPor,
    };

    if (this.supabase.isConfigured()) {
      const userId = this.auth.usuarioLogado()?.id;
      if (!userId) {
        return from(Promise.reject(new Error('Usuário não autenticado.')));
      }

      return from(
        this.supabase.insertConvite(draft, userId).then((saved) => {
          if (!saved) throw new Error('Falha ao registrar convite no Supabase.');
          return saved;
        }),
      ).pipe(tap((saved) => this.convites.update((list) => [...list, saved])));
    }

    return this.http.post<Convite>(this.convitesUrl, draft).pipe(
      tap((saved) => this.convites.update((list) => [...list, saved])),
    );
  }

  removerMembro(id: string): Observable<void> {
    if (this.supabase.isConfigured()) {
      return from(Promise.reject(new Error('Remoção de membros via Supabase em breve.')));
    }

    return this.http.delete<void>(`${this.usuariosUrl}/${id}`).pipe(
      tap(() => {
        this.membros.update((list) => list.filter((m) => m.id !== id));
      }),
    );
  }
}
