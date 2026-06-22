import { computed, Injectable, signal } from '@angular/core';
import {
  AuthResponse,
  createClient,
  Session,
  SupabaseClient,
  User,
} from '@supabase/supabase-js';

import { Transaction, TransactionStatus } from '@app/shared/models/transaction.model';
import { environment } from '../../../environments/environment';

/**
 * Camada fina sobre o cliente Supabase.
 *
 * Responsabilidades:
 *   - Instanciar e expor o cliente Supabase
 *   - Manter o estado de sessão reativo via `session` signal
 *   - Helpers de autenticação (email/password)
 *   - CRUD tipado para a tabela `transactions`
 */
@Injectable({ providedIn: 'root' })
export class SupabaseService {
  /** Cliente Supabase — exposto para uso pontual em guards e serviços. */
  readonly client: SupabaseClient = createClient(
    environment.supabase.url,
    environment.supabase.publishableKey,
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

    return (data ?? []) as Transaction[];
  }

  async insertTransaction(transaction: Omit<Transaction, 'id'>): Promise<Transaction | null> {
    const { data, error } = await this.client
      .from('transactions')
      .insert([transaction])
      .select()
      .single();

    if (error) {
      console.error('[SupabaseService] insertTransaction:', error.message);
      return null;
    }

    return data as Transaction;
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

  async updateTransaction(id: number, transaction: Omit<Transaction, 'id'>): Promise<Transaction | null> {
    const { data, error } = await this.client
      .from('transactions')
      .update(transaction)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[SupabaseService] updateTransaction:', error.message);
      return null;
    }

    return data as Transaction;
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

  /** `false` enquanto as credenciais no `.env` ainda são placeholder. */
  isConfigured(): boolean {
    const { url, publishableKey } = environment.supabase;
    return (
      url.length > 0 &&
      !url.includes('SEU_PROJECT_ID') &&
      publishableKey.length > 0 &&
      !publishableKey.includes('SUA_CHAVE')
    );
  }
}
