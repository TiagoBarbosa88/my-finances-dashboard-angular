import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { AuthService } from '@app/core/services/auth.service';
import { Convite, ConviteDraft, Usuario } from '@app/shared/models/team.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class TeamService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  private readonly usuariosUrl = `${environment.apiUrl}/usuarios`;
  private readonly convitesUrl = `${environment.apiUrl}/convites`;

  readonly membros = signal<Usuario[]>([]);
  readonly convites = signal<Convite[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);

  loadMembros(): void {
    this.loading.set(true);

    this.http.get<Usuario[]>(this.usuariosUrl).subscribe({
      next: (data) => this.membros.set(data),
      error: () => this.loading.set(false),
      complete: () => this.loading.set(false),
    });
  }

  loadConvites(): void {
    this.http.get<Convite[]>(this.convitesUrl).subscribe({
      next: (data) => this.convites.set(data),
      error: () => this.convites.set([]),
    });
  }

  enviarConvite(email: string, role: ConviteDraft['role']): Observable<Convite> {
    const convidadoPor = this.auth.usuarioLogado()?.nome ?? 'Admin';
    const draft: Omit<Convite, 'id'> = {
      email: email.trim().toLowerCase(),
      role,
      status: 'pendente',
      criado_em: new Date().toISOString().split('T')[0],
      convidado_por: convidadoPor,
    };

    return this.http.post<Convite>(this.convitesUrl, draft).pipe(
      tap((saved) => this.convites.update((list) => [...list, saved])),
    );
  }

  removerMembro(id: string): Observable<void> {
    return this.http.delete<void>(`${this.usuariosUrl}/${id}`).pipe(
      tap(() => {
        this.membros.update((list) => list.filter((m) => m.id !== id));
      }),
    );
  }
}
