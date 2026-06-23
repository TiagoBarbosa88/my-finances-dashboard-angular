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

      if (environment.production) {
        return from(this.enviarConviteViaApi(draft)).pipe(
          tap(() => this.loadConvites()),
        );
      }

      return from(
        this.supabase.insertConvite(draft, userId).then((saved) => {
          if (!saved) throw new Error('Falha ao registrar convite no Supabase.');
          return saved;
        }),
      ).pipe(tap(() => this.loadConvites()));
    }

    return this.http.post<Convite>(this.convitesUrl, draft).pipe(
      tap((saved) => this.convites.update((list) => [...list, saved])),
    );
  }

  /** Produção: envia e-mail via Supabase Auth (API serverless na Vercel). */
  private async enviarConviteViaApi(draft: ConviteDraft): Promise<Convite> {
    const session = await this.supabase.getSession();
    const token = session?.access_token;

    if (!token) {
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    const response = await fetch('/api/invite-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        email: draft.email,
        role: draft.role,
        convidado_por: draft.convidado_por,
      }),
    });

    const body = (await response.json()) as { convite?: Convite; error?: string; message?: string };

    if (!response.ok) {
      throw new Error(body.error || 'Falha ao enviar convite.');
    }

    if (!body.convite) {
      throw new Error('Resposta inválida do servidor de convites.');
    }

    return body.convite;
  }

  atualizarConvite(
    id: number,
    patch: { email?: string; role?: ConviteDraft['role'] },
  ): Observable<Convite> {
    if (this.supabase.isConfigured()) {
      if (environment.production) {
        return from(this.patchConviteViaApi(id, patch)).pipe(tap(() => this.loadConvites()));
      }

      return from(
        this.supabase.updateConvite(id, patch).then((saved) => {
          if (!saved) throw new Error('Falha ao atualizar convite.');
          return saved;
        }),
      ).pipe(tap(() => this.loadConvites()));
    }

    return this.http.patch<Convite>(`${this.convitesUrl}/${id}`, patch).pipe(
      tap((saved) => {
        this.convites.update((list) => list.map((c) => (c.id === id ? saved : c)));
      }),
    );
  }

  removerConvite(id: number): Observable<void> {
    if (this.supabase.isConfigured()) {
      if (environment.production) {
        return from(this.deleteConviteViaApi(id)).pipe(tap(() => this.loadConvites()));
      }

      return from(
        this.supabase.deleteConvite(id).then((ok) => {
          if (!ok) throw new Error('Falha ao remover convite.');
        }),
      ).pipe(
        tap(() => {
          this.convites.update((list) => list.filter((c) => c.id !== id));
        }),
      );
    }

    return this.http.delete<void>(`${this.convitesUrl}/${id}`).pipe(
      tap(() => {
        this.convites.update((list) => list.filter((c) => c.id !== id));
      }),
    );
  }

  reenviarConvite(id: number): Observable<Convite> {
    if (this.supabase.isConfigured()) {
      if (environment.production) {
        return from(this.reenviarConviteViaApi(id)).pipe(tap(() => this.loadConvites()));
      }

      return from(Promise.reject(new Error('Reenvio de e-mail só funciona em produção (Vercel).')));
    }

    return from(Promise.reject(new Error('Reenvio de e-mail indisponível no JSON Server local.')));
  }

  private async conviteApiRequest(
    method: 'PATCH' | 'DELETE' | 'POST',
    body: Record<string, unknown>,
  ): Promise<{ convite?: Convite }> {
    const session = await this.supabase.getSession();
    const token = session?.access_token;

    if (!token) {
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    const response = await fetch('/api/convite', {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    const payload = (await response.json()) as {
      convite?: Convite;
      error?: string;
      message?: string;
    };

    if (!response.ok) {
      throw new Error(payload.error || 'Falha ao gerenciar convite.');
    }

    return payload;
  }

  private async patchConviteViaApi(
    id: number,
    patch: { email?: string; role?: ConviteDraft['role'] },
  ): Promise<Convite> {
    const payload = await this.conviteApiRequest('PATCH', { id, ...patch });

    if (!payload.convite) {
      throw new Error('Resposta inválida do servidor de convites.');
    }

    return payload.convite;
  }

  private async deleteConviteViaApi(id: number): Promise<void> {
    await this.conviteApiRequest('DELETE', { id });
  }

  private async reenviarConviteViaApi(id: number): Promise<Convite> {
    const payload = await this.conviteApiRequest('POST', { action: 'resend', id });

    if (!payload.convite) {
      throw new Error('Resposta inválida do servidor de convites.');
    }

    return payload.convite;
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
