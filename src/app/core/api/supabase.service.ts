import { computed, Injectable, signal } from '@angular/core';
import {
  AuthResponse,
  createClient,
  Session,
  SupabaseClient,
  User,
} from '@supabase/supabase-js';

import { Convite, ConviteDraft, Usuario, UserRole } from '@shared/models/team.model';
import { Transaction, TransactionStatus } from '@shared/models/transaction.model';
import { environment } from '../../../environments/environment';
import {
  ativoFromRow,
  AtivoRow,
  conviteFromRow,
  ConviteRow,
  profileToUsuario,
  ProfileRow,
  targetMetaFromRow,
  TargetMetaRow,
  transactionFromRow,
  TransactionRow,
  transactionToRow,
} from './supabase.mapper';
import { Ativo, TargetMeta } from '@shared/models/investimentos.model';

/**
 * Camada fina sobre o cliente Supabase.
 *
 * Responsabilidades:
 *   - Instanciar e expor o cliente Supabase
 *   - Manter o estado de sessão reativo via `session` signal
 *   - Helpers de autenticação (email/password)
 *   - CRUD tipado para `profiles` e `transactions`
 */
@Injectable({ providedIn: 'root' })
export class SupabaseService {
  /** Cliente Supabase — exposto para uso pontual em guards e serviços. */
  readonly client: SupabaseClient = createClient(
    environment.supabase.url,
    environment.supabase.publishableKey,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    },
  );

  // ─── Estado de autenticação reativo ───────────────────────────────────────

  /** Sessão atual. `null` = não autenticado. */
  readonly session = signal<Session | null>(null);

  /** Usuário derivado da sessão — `null` quando não logado. */
  readonly currentUser = computed<User | null>(() => this.session()?.user ?? null);

  constructor() {
    // Carrega a sessão persitida (token no localStorage do browser)
    this.client.auth.getSession().then(({ data }) => {
      this.session.set(data.session);
    });

    // Atualiza o signal a cada evento de auth (login, logout, refresh de token)
    this.client.auth.onAuthStateChange((_event, session) => {
      this.session.set(session);
    });
  }

  // ─── Autenticação ─────────────────────────────────────────────────────────

  /** Login com e-mail + senha. */
  signInWithEmail(email: string, password: string): Promise<AuthResponse> {
    return this.client.auth.signInWithPassword({ email, password });
  }

  /** Login com Google OAuth — redirect de volta para a origem atual. */
  async signInWithGoogle(): Promise<{ error: Error | null }> {
    if (typeof window === 'undefined') {
      return { error: new Error('OAuth indisponível neste ambiente.') };
    }

    const redirectTo = `${window.location.origin}/`;
    const { error } = await this.client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });

    return { error: error ?? null };
  }

  /** Encerra a sessão ativa. */
  signOut(): Promise<{ error: Error | null }> {
    return this.client.auth.signOut();
  }

  /** Define senha do usuário logado (ex.: após aceitar convite). */
  async setPassword(password: string): Promise<{ error: Error | null }> {
    const { error } = await this.client.auth.updateUser({ password });
    return { error: error ?? null };
  }

  /** Retorna o usuário logado ou `null`. */
  async getUser(): Promise<User | null> {
    const { data } = await this.client.auth.getUser();
    return data.user;
  }

  /** Retorna a sessão ativa ou `null` — usado pelo AuthGuard. */
  async getSession(): Promise<Session | null> {
    const { data } = await this.client.auth.getSession();
    return data.session;
  }

  /** Resultado do processamento de redirect OAuth / convite na URL. */
  async processAuthRedirectFromUrl(): Promise<{ session: Session | null; type: string | null }> {
    if (typeof window === 'undefined') {
      return { session: null, type: null };
    }

    const hash = window.location.hash.replace(/^#/, '');
    const search = window.location.search.replace(/^\?/, '');
    const hashParams = new URLSearchParams(hash);
    const searchParams = new URLSearchParams(search);
    const type = hashParams.get('type') ?? searchParams.get('type');
    const hasHashTokens = hash.includes('access_token=');
    const authCode = searchParams.get('code');

    if (!hasHashTokens && !authCode) {
      return { session: await this.getSession(), type: null };
    }

    if (authCode) {
      const { data, error } = await this.client.auth.exchangeCodeForSession(authCode);
      if (error) {
        console.error('[SupabaseService] exchangeCodeForSession:', error.message);
        return { session: null, type };
      }
      this.session.set(data.session);
    } else {
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      if (accessToken && refreshToken) {
        const { data, error } = await this.client.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) {
          console.error('[SupabaseService] setSession from hash:', error.message);
          return { session: null, type };
        }
        this.session.set(data.session);
      } else {
        for (let attempt = 0; attempt < 20; attempt++) {
          await new Promise((resolve) => window.setTimeout(resolve, 50));
          const session = await this.getSession();
          if (session) break;
        }
      }
    }

    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);

    const session = await this.getSession();
    if (session) {
      await this.markConviteAceitoForCurrentUser();
    }

    return { session, type };
  }

  /** Marca convites pendentes do e-mail logado como aceitos (fallback ao trigger SQL). */
  async markConviteAceitoForCurrentUser(): Promise<void> {
    const { error } = await this.client.rpc('accept_my_invite');
    if (error) {
      const user = await this.getUser();
      if (!user?.email) return;

      const { error: updateError } = await this.client
        .from('convites')
        .update({ status: 'aceito' })
        .eq('email', user.email.toLowerCase())
        .eq('status', 'pendente');

      if (updateError) {
        console.warn('[SupabaseService] markConviteAceito:', updateError.message);
      }
    }
  }

  // ─── Perfil — tabela `profiles` ───────────────────────────────────────────

  async fetchProfile(userId: string): Promise<Usuario | null> {
    const { data, error } = await this.client
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('id', userId)
      .single();

    if (error || !data) {
      console.error('[SupabaseService] fetchProfile:', error?.message);
      return null;
    }

    return profileToUsuario(data as ProfileRow);
  }

  async updateProfile(userId: string, nome: string, email: string): Promise<Usuario | null> {
    const { data, error } = await this.client
      .from('profiles')
      .update({
        full_name: nome.trim(),
        email: email.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select('id, full_name, email, role')
      .single();

    if (error || !data) {
      console.error('[SupabaseService] updateProfile:', error?.message);
      return null;
    }

    return profileToUsuario(data as ProfileRow);
  }

  async fetchProfiles(): Promise<Usuario[]> {
    const session = await this.getSession();
    if (!session?.user) return [];

    const mine = await this.fetchProfile(session.user.id);
    if (!mine) return [];

    const workspaceId = await this.resolveWorkspaceId(session.user.id);
    if (!workspaceId) return [mine];

    const { data, error } = await this.client
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('workspace_id', workspaceId)
      .order('full_name');

    if (error) {
      console.error('[SupabaseService] fetchProfiles:', error.message);
      return mine ? [mine] : [];
    }

    return (data ?? []).map((row) => profileToUsuario(row as ProfileRow));
  }

  /** workspace_id do usuário (fallback: próprio id). */
  private async resolveWorkspaceId(userId: string): Promise<string | null> {
    const { data, error } = await this.client
      .from('profiles')
      .select('workspace_id')
      .eq('id', userId)
      .single();

    if (error || !data?.workspace_id) return userId;
    return data.workspace_id as string;
  }

  async fetchConvites(): Promise<Convite[]> {
    const session = await this.getSession();
    if (!session?.user) return [];

    const workspaceId = await this.resolveWorkspaceId(session.user.id);
    if (!workspaceId) return [];

    const { data: admins, error: adminErr } = await this.client
      .from('profiles')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('role', 'admin');

    if (adminErr || !admins?.length) {
      const { data, error } = await this.client
        .from('convites')
        .select('*')
        .eq('invited_by', session.user.id)
        .order('criado_em', { ascending: false });

      if (error) {
        console.error('[SupabaseService] fetchConvites:', error.message);
        return [];
      }
      return (data ?? []).map((row) => conviteFromRow(row as ConviteRow));
    }

    const adminIds = admins.map((a) => a.id as string);
    const { data, error } = await this.client
      .from('convites')
      .select('*')
      .in('invited_by', adminIds)
      .order('criado_em', { ascending: false });

    if (error) {
      console.error('[SupabaseService] fetchConvites:', error.message);
      return [];
    }

    return (data ?? []).map((row) => conviteFromRow(row as ConviteRow));
  }

  async insertConvite(
    draft: ConviteDraft,
    invitedById: string,
  ): Promise<Convite | null> {
    const row = {
      nome: draft.nome.trim(),
      email: draft.email.trim().toLowerCase(),
      role: draft.role,
      status: draft.status,
      convidado_por: draft.convidado_por,
      invited_by: invitedById,
    };

    const { data, error } = await this.client
      .from('convites')
      .insert([row])
      .select()
      .single();

    if (error) {
      console.error('[SupabaseService] insertConvite:', error.message);
      return null;
    }

    return conviteFromRow(data as ConviteRow);
  }

  async updateConvite(
    id: number,
    patch: { nome?: string; email?: string; role?: ConviteDraft['role'] },
  ): Promise<Convite | null> {
    const updates: Record<string, string> = {};
    if (patch.nome) updates['nome'] = patch.nome.trim();
    if (patch.email) updates['email'] = patch.email.trim().toLowerCase();
    if (patch.role) updates['role'] = patch.role;

    const { data, error } = await this.client
      .from('convites')
      .update(updates)
      .eq('id', id)
      .eq('status', 'pendente')
      .select()
      .single();

    if (error) {
      console.error('[SupabaseService] updateConvite:', error.message);
      return null;
    }

    return conviteFromRow(data as ConviteRow);
  }

  async deleteConvite(id: number): Promise<boolean> {
    const { error } = await this.client.from('convites').delete().eq('id', id);

    if (error) {
      console.error('[SupabaseService] deleteConvite:', error.message);
      return false;
    }

    return true;
  }

  async updateMemberRole(userId: string, role: UserRole): Promise<Usuario | null> {
    const { data, error } = await this.client
      .from('profiles')
      .update({
        role,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select('id, full_name, email, role')
      .single();

    if (error) {
      console.error('[SupabaseService] updateMemberRole:', error.message);
      return null;
    }

    return profileToUsuario(data as ProfileRow);
  }

  /** Dev local: remove só o profile (sem Auth admin). */
  async deleteMemberProfile(userId: string): Promise<boolean> {
    const { error } = await this.client.from('profiles').delete().eq('id', userId);

    if (error) {
      console.error('[SupabaseService] deleteMemberProfile:', error.message);
      return false;
    }

    return true;
  }

  async fetchAtivos(): Promise<Ativo[]> {
    const userId = (await this.getSession())?.user?.id;
    if (!userId) return [];

    const { data, error } = await this.client
      .from('ativos')
      .select('*')
      .eq('user_id', userId)
      .order('ticker');

    if (error) {
      console.error('[SupabaseService] fetchAtivos:', error.message);
      return [];
    }

    return (data ?? []).map((row) => ativoFromRow(row as AtivoRow));
  }

  async fetchTargetMetas(): Promise<TargetMeta[]> {
    const userId = (await this.getSession())?.user?.id;
    if (!userId) return [];

    const { data, error } = await this.client
      .from('target_metas')
      .select('tipo, target_percent')
      .eq('user_id', userId)
      .order('tipo');

    if (error) {
      console.error('[SupabaseService] fetchTargetMetas:', error.message);
      return [];
    }

    return (data ?? []).map((row) => targetMetaFromRow(row as TargetMetaRow));
  }

  // ─── CRUD — tabela `transactions` ─────────────────────────────────────────

  async fetchTransactions(): Promise<Transaction[]> {
    const userId = (await this.getSession())?.user?.id;
    if (!userId) return [];

    const { data, error } = await this.client
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('data', { ascending: false });

    if (error) {
      console.error('[SupabaseService] fetchTransactions:', error.message);
      return [];
    }

    return (data ?? []).map((row) => transactionFromRow(row as TransactionRow));
  }

  async insertTransaction(
    transaction: Omit<Transaction, 'id'>,
    userId: string,
  ): Promise<Transaction | null> {
    const row = transactionToRow(transaction, userId);

    const { data, error } = await this.client
      .from('transactions')
      .insert([row])
      .select()
      .single();

    if (error) {
      console.error('[SupabaseService] insertTransaction:', error.message);
      return null;
    }

    return transactionFromRow(data as TransactionRow);
  }

  async updateTransactionStatus(id: number, status: TransactionStatus): Promise<boolean> {
    const { error } = await this.client
      .from('transactions')
      .update({ status })
      .eq('id', id);

    if (error) {
      console.error('[SupabaseService] updateTransactionStatus:', error.message);
      return false;
    }

    return true;
  }

  async updateTransaction(
    id: number,
    transaction: Omit<Transaction, 'id'>,
    userId: string,
  ): Promise<Transaction | null> {
    const row = transactionToRow(transaction, userId);

    const { data, error } = await this.client
      .from('transactions')
      .update(row)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[SupabaseService] updateTransaction:', error.message);
      return null;
    }

    return transactionFromRow(data as TransactionRow);
  }

  async deleteTransaction(id: number): Promise<boolean> {
    const { error } = await this.client
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[SupabaseService] deleteTransaction:', error.message);
      return false;
    }

    return true;
  }

  /** `false` enquanto as credenciais ainda são placeholder. */
  isConfigured(): boolean {
    const { url, publishableKey } = environment.supabase;
    const placeholder =
      url.includes('SEU_PROJECT') ||
      publishableKey.includes('SUA_CHAVE') ||
      publishableKey.length < 20;

    return url.length > 0 && publishableKey.length > 0 && !placeholder;
  }
}
