/**
 * Helpers compartilhados para convites via Supabase Auth Admin.
 * Evita listUsers paginado (caro e dispara rate limit do Supabase).
 */
function mapInviteAuthError(message) {
  if (!message || typeof message !== 'string') return null;

  const lower = message.toLowerCase();

  if (lower.includes('already registered') || lower.includes('already been registered')) {
    return 'Este e-mail já possui acesso ao Smart Finances.';
  }
  if (lower.includes('rate limit') || lower.includes('too many requests') || lower.includes('email rate limit')) {
    return 'Limite de envios atingido. Aguarde cerca de 1 hora antes de convidar novamente.';
  }
  if (lower.includes('invalid email')) {
    return 'E-mail inválido.';
  }
  if (lower.includes('not authorized') || lower.includes('invalid api key')) {
    return 'Configuração do servidor incompleta. Contate o responsável técnico.';
  }

  return null;
}

/** Busca leve — apenas 1 página (equipes pequenas). Não lança exceção. */
async function findUserByEmail(admin, email) {
  const target = email.trim().toLowerCase();
  const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });

  if (error) {
    console.error('[invite] listUsers:', error.message);
    return null;
  }

  return data.users.find((u) => u.email?.toLowerCase() === target) ?? null;
}

async function deleteAuthUserIfUnconfirmed(admin, email) {
  const user = await findUserByEmail(admin, email);
  if (!user || user.email_confirmed_at) return false;

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    console.error('[invite] deleteUser:', error.message);
    return false;
  }

  return true;
}

async function sendInviteEmail(admin, email, role, nome, siteUrl) {
  const displayName = (nome || email.split('@')[0]).trim();
  const options = {
    redirectTo: siteUrl,
    data: { role, full_name: displayName },
  };

  let { error } = await admin.auth.admin.inviteUserByEmail(email, options);
  if (!error) return { ok: true };

  let mapped = mapInviteAuthError(error.message);
  if (mapped) return { ok: false, error: mapped };

  // Convite anterior não concluído — remove usuário não confirmado e tenta 1x
  await deleteAuthUserIfUnconfirmed(admin, email);
  ({ error } = await admin.auth.admin.inviteUserByEmail(email, options));

  if (!error) return { ok: true };

  mapped = mapInviteAuthError(error.message);
  if (mapped) return { ok: false, error: mapped };

  return {
    ok: false,
    error: error.message?.length < 120 && !error.message.includes('http')
      ? error.message
      : 'Não foi possível enviar o convite. Tente novamente em alguns minutos.',
  };
}

function mapConviteRow(convite, fallbackNome) {
  const criadoEm = convite.criado_em?.includes('T')
    ? convite.criado_em.split('T')[0]
    : convite.criado_em;

  return {
    id: convite.id,
    nome: convite.nome || fallbackNome || convite.email.split('@')[0],
    email: convite.email,
    role: convite.role,
    status: convite.status,
    criado_em: criadoEm,
    convidado_por: convite.convidado_por,
  };
}

module.exports = {
  deleteAuthUserIfUnconfirmed,
  findUserByEmail,
  mapConviteRow,
  mapInviteAuthError,
  sendInviteEmail,
};
