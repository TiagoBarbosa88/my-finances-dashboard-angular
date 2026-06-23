/** Mensagens amigáveis — sem termos de infra ou provedores. */
export function userFacingMessage(raw: string | undefined, fallback: string): string {
  if (!raw?.trim()) return fallback;

  const msg = raw.trim();
  const lower = msg.toLowerCase();

  if (lower.includes('supabase') || lower.includes('vercel') || lower.includes('env var')) {
    return 'Serviço indisponível no momento. Tente novamente mais tarde.';
  }
  if (lower.includes('jwt') || lower.includes('api key') || lower.includes('invalid jwt')) {
    return 'Sessão expirada. Faça login novamente.';
  }
  if (lower.includes('already registered') || lower.includes('already been registered')) {
    return 'Este e-mail já possui acesso ao Smart Finances.';
  }
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Muitas tentativas. Aguarde alguns minutos.';
  }
  if (lower.includes('row-level security') || lower.includes('permission denied')) {
    return 'Você não tem permissão para esta ação.';
  }
  if (lower.includes('method not allowed') || lower.includes('erro interno')) {
    return fallback;
  }

  if (
    msg.length <= 120 &&
    !lower.includes('error') &&
    !lower.includes('http') &&
    !/[_]{1}/.test(msg)
  ) {
    return msg;
  }

  return fallback;
}
