/**
 * Helpers compartilhados para convites via Supabase Auth Admin.
 */
async function findUserByEmail(admin, email) {
  const target = email.trim().toLowerCase();
  let page = 1;

  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;

    const user = data.users.find((u) => u.email?.toLowerCase() === target);
    if (user) return user;

    if (data.users.length < 200) break;
    page += 1;
  }

  return null;
}

async function deleteAuthUserIfUnconfirmed(admin, email) {
  const user = await findUserByEmail(admin, email);
  if (!user || user.email_confirmed_at) return;
  await admin.auth.admin.deleteUser(user.id);
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
  findUserByEmail,
  deleteAuthUserIfUnconfirmed,
  mapConviteRow,
};
