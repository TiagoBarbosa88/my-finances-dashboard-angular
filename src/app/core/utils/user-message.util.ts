/** Mensagens amigáveis — sem termos de infra desnecessários. */
export function userFacingMessage(raw: string | undefined, fallback: string): string {
  if (!raw?.trim()) return fallback;

  const msg = raw.trim();
  const lower = msg.toLowerCase();

  if (
    lower.includes('service role') ||
    lower.includes('service_role') ||
    lower.includes('missing env') ||
    lower.includes('env var') ||
    lower.includes('not configured') ||
    lower.includes('configuração do servidor')
  ) {
    return 'Envio de convites indisponível. O responsável técnico precisa concluir a configuração do servidor.';
  }

  if (lower.includes('jwt') || lower.includes('invalid api key') || lower.includes('invalid jwt')) {
    return 'Sessão expirada. Faça login novamente.';
  }
  if (lower.includes('already registered') || lower.includes('already been registered')) {
    return 'Este e-mail já possui acesso ao Smart Finances.';
  }
  if (
    lower.includes('rate limit') ||
    lower.includes('too many requests') ||
    lower.includes('email rate limit') ||
    (lower.includes('aguarde') && lower.includes('segundos'))
  ) {
    return msg.length <= 120 ? msg : 'Limite de envios atingido. Aguarde antes de tentar novamente.';
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
    !lower.includes('auth/v1') &&
    !/[_]{2,}/.test(msg)
  ) {
    return msg;
  }

  return fallback;
}
