import { computed, Injectable, signal } from '@angular/core';
import {
  AuthResponse,
  createClient,
  Session,
  SupabaseClient,
  User,
} from '@supabase/supabase-js';

import { Convite, ConviteDraft, Usuario, UserRole } from '@app/shared/models/team.model';
import { Transaction, TransactionStatus } from '@app/shared/models/transaction.model';
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
import { Ativo, TargetMeta } from '@app/shared/models/investimentos.model';

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

  /** Encerra a sessão ativa. */
  signOut(): Promise<{ error: Error | null }> {
    return this.client.auth.signOut();
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
    const { data, error } = await this.client
      .from('profiles')
      .select('id, full_name, email, role')
      .order('full_name');

    if (error) {
      console.error('[SupabaseService] fetchProfiles:', error.message);
      return [];
    }

    return (data ?? []).map((row) => profileToUsuario(row as ProfileRow));
  }

  async fetchConvites(): Promise<Convite[]> {
    const { data, error } = await this.client
      .from('convites')
      .select('*')
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
    const { data, error } = await this.client
      .from('ativos')
      .select('*')
      .order('ticker');

    if (error) {
      console.error('[SupabaseService] fetchAtivos:', error.message);
      return [];
    }

    return (data ?? []).map((row) => ativoFromRow(row as AtivoRow));
  }

  async fetchTargetMetas(): Promise<TargetMeta[]> {
    const { data, error } = await this.client
      .from('target_metas')
      .select('tipo, target_percent')
      .order('tipo');

    if (error) {
      console.error('[SupabaseService] fetchTargetMetas:', error.message);
      return [];
    }

    return (data ?? []).map((row) => targetMetaFromRow(row as TargetMetaRow));
  }

  // ─── CRUD — tabela `transactions` ─────────────────────────────────────────

  async fetchTransactions(): Promise<Transaction[]> {
    const { data, error } = await this.client
      .from('transactions')
      .select('*')
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
