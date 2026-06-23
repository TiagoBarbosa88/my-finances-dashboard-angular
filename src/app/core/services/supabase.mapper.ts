import { Usuario, UserRole } from '@app/shared/models/team.model';
import { Transaction, TransactionStatus } from '@app/shared/models/transaction.model';

/** Linha da tabela `profiles`. */
export interface ProfileRow {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
}

/** Linha da tabela `transactions`. */
export interface TransactionRow {
  id: number;
  user_id: string;
  data: string;
  descricao: string;
  categoria: string;
  valor: number;
  status: TransactionStatus;
  criado_por: string;
  created_at?: string;
  updated_at?: string;
}

export function profileToUsuario(row: ProfileRow): Usuario {
  return {
    id: row.id,
    nome: row.full_name,
    email: row.email,
    role: row.role,
  };
}

export function transactionFromRow(row: TransactionRow): Transaction {
  return {
    id: row.id,
    data: row.data,
    descricao: row.descricao,
    categoria: row.categoria,
    valor: Number(row.valor),
    status: row.status,
    criado_por: row.criado_por,
    user_id: row.user_id,
  };
}

export function transactionToRow(
  transaction: Omit<Transaction, 'id'>,
  userId: string,
): Omit<TransactionRow, 'id' | 'created_at' | 'updated_at'> {
  return {
    user_id: userId,
    data: transaction.data,
    descricao: transaction.descricao,
    categoria: transaction.categoria,
    valor: transaction.valor,
    status: transaction.status,
    criado_por: transaction.criado_por,
  };
}

/** Linha da tabela `convites`. */
export interface ConviteRow {
  id: number;
  email: string;
  role: UserRole;
  status: 'pendente' | 'aceito' | 'expirado';
  criado_em: string;
  convidado_por: string;
  invited_by?: string | null;
}

export function conviteFromRow(row: ConviteRow) {
  const date = row.criado_em.includes('T')
    ? row.criado_em.split('T')[0]
    : row.criado_em;

  return {
    id: row.id,
    email: row.email,
    role: row.role,
    status: row.status,
    criado_em: date,
    convidado_por: row.convidado_por,
  };
}
