import { inject, Injectable, signal } from '@angular/core';
import { from, Observable } from 'rxjs';

import { SupabaseService } from '@core/api/supabase.service';
import { userFacingMessage } from '@core/utils/user-message.util';

export interface WhatsAppLinkStatus {
  linked: boolean;
  phone: string | null;
  pendingCode: boolean;
}

export interface WhatsAppLinkCodeResponse {
  code: string;
  expiresAt: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class WhatsAppService {
  private readonly supabase = inject(SupabaseService);

  readonly status = signal<WhatsAppLinkStatus | null>(null);
  readonly loading = signal(false);
  readonly lastCode = signal<string | null>(null);
  readonly lastCodeExpiresAt = signal<string | null>(null);

  loadStatus(): Observable<WhatsAppLinkStatus> {
    return from(this.fetchStatus());
  }

  generateCode(phone?: string): Observable<WhatsAppLinkCodeResponse> {
    return from(this.postLink({ phone }));
  }

  unlink(): Observable<{ ok: boolean; message: string }> {
    return from(this.deleteLink());
  }

  private async authHeaders(): Promise<HeadersInit> {
    const session = await this.supabase.getSession();
    const token = session?.access_token;
    if (!token) throw new Error('Sessão expirada. Faça login novamente.');

    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  private async fetchStatus(): Promise<WhatsAppLinkStatus> {
    if (!this.supabase.isConfigured()) {
      const offline: WhatsAppLinkStatus = { linked: false, phone: null, pendingCode: false };
      this.status.set(offline);
      return offline;
    }

    this.loading.set(true);

    try {
      const response = await fetch('/api/whatsapp/link', {
        method: 'GET',
        headers: await this.authHeaders(),
      });

      const body = (await response.json()) as WhatsAppLinkStatus & { error?: string };
      if (!response.ok) {
        throw new Error(userFacingMessage(body.error, 'Não foi possível carregar status WhatsApp.'));
      }

      this.status.set(body);
      return body;
    } finally {
      this.loading.set(false);
    }
  }

  private async postLink(payload: { phone?: string }): Promise<WhatsAppLinkCodeResponse> {
    const response = await fetch('/api/whatsapp/link', {
      method: 'POST',
      headers: await this.authHeaders(),
      body: JSON.stringify(payload),
    });

    const body = (await response.json()) as WhatsAppLinkCodeResponse & { error?: string };
    if (!response.ok) {
      throw new Error(userFacingMessage(body.error, 'Não foi possível gerar código.'));
    }

    this.lastCode.set(body.code);
    this.lastCodeExpiresAt.set(body.expiresAt);
    this.status.update((s) =>
      s ? { ...s, pendingCode: true } : { linked: false, phone: null, pendingCode: true },
    );

    return body;
  }

  private async deleteLink(): Promise<{ ok: boolean; message: string }> {
    const response = await fetch('/api/whatsapp/link', {
      method: 'DELETE',
      headers: await this.authHeaders(),
    });

    const body = (await response.json()) as { ok?: boolean; message?: string; error?: string };
    if (!response.ok) {
      throw new Error(userFacingMessage(body.error, 'Não foi possível desvincular.'));
    }

    this.lastCode.set(null);
    this.lastCodeExpiresAt.set(null);
    this.status.set({ linked: false, phone: null, pendingCode: false });

    return { ok: true, message: body.message || 'WhatsApp desvinculado.' };
  }
}
