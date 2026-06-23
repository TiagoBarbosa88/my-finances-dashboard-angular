export type UserRole = 'admin' | 'editor' | 'leitor';

export type ConviteStatus = 'pendente' | 'aceito' | 'expirado';

export interface Usuario {
  /** UUID (Supabase) ou id string do JSON Server local. */
  id: string;
  nome: string;
  email: string;
  role: UserRole;
}

export interface Convite {
  id: number;
  email: string;
  role: UserRole;
  status: ConviteStatus;
  criado_em: string;
  convidado_por: string;
}

export interface ConviteDraft {
  email: string;
  role: UserRole;
  status: ConviteStatus;
  criado_em: string;
  convidado_por: string;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin:  'Admin',
  editor: 'Editor',
  leitor: 'Leitor',
};

export const ROLE_OPTIONS: UserRole[] = ['admin', 'editor', 'leitor'];
