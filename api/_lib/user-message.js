/**
 * Converte erros técnicos (Supabase, infra) em mensagens amigáveis para a UI.
 */
function userFacingError(raw, fallback = 'Não foi possível concluir a operação. Tente novamente.') {
  if (!raw || typeof raw !== 'string') return fallback;

  const msg = raw.trim();
  const lower = msg.toLowerCase();

  if (lower.includes('method not allowed')) return fallback;
  if (lower.includes('supabase') || lower.includes('vercel') || lower.includes('env var')) {
    return 'Serviço indisponível no momento. Tente novamente mais tarde.';
  }
  if (lower.includes('invalid login credentials') || lower.includes('invalid credentials')) {
    return 'E-mail ou senha incorretos.';
  }
  if (lower.includes('email not confirmed')) {
    return 'Confirme o e-mail antes de continuar.';
  }
  if (lower.includes('already registered') || lower.includes('already been registered')) {
    return 'Este e-mail já possui acesso ao Smart Finances.';
  }
  if (lower.includes('user not found')) {
    return 'Usuário não encontrado.';
  }
  if (lower.includes('jwt') || lower.includes('api key') || lower.includes('unauthorized')) {
    return 'Sessão expirada. Faça login novamente.';
  }
  if (lower.includes('rate limit') || lower.includes('too many requests')) {
    return 'Limite de envios do Supabase atingido. Aguarde cerca de 1 hora antes de convidar novamente.';
  }
  if (lower.includes('duplicate key') || lower.includes('unique constraint')) {
    return 'Este convite já foi registrado.';
  }
  if (lower.includes('permission denied') || lower.includes('row-level security')) {
    return 'Você não tem permissão para esta ação.';
  }

  // Mensagens já amigáveis em português
  if (/^[A-ZÁÉÍÓÚÃÕÇ]/.test(msg) && !lower.includes('error') && msg.length < 120) {
    return msg;
  }

  return fallback;
}

module.exports = { userFacingError };
