/**
 * DELETE /api/convite — remove convite pendente (+ usuário Auth não confirmado)
 * PATCH /api/convite — atualiza e-mail/permissão de convite pendente
 * POST   /api/convite — { action: 'resend', id } reenvia e-mail
 */
const { createClient } = require('@supabase/supabase-js');
const {
  deleteAuthUserIfUnconfirmed,
  mapConviteRow,
} = require('./_lib/invite-helpers');
const { inviteRedirectUrl } = require('./_lib/site-url');
const { userFacingError } = require('./_lib/user-message');

function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return {};
}

function getSupabaseClients() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey || !serviceKey) {
    throw new Error('Serviço indisponível no momento.');
  }

  const userClient = createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return { userClient, admin };
}

async function assertAdmin(userClient, admin, token) {
  const { data: userData, error: userErr } = await userClient.auth.getUser(token);
  if (userErr || !userData.user) {
    const err = new Error('Sessão inválida. Faça login novamente.');
    err.status = 401;
    throw err;
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('role, full_name')
    .eq('id', userData.user.id)
    .single();

  if (profile?.role !== 'admin') {
    const err = new Error('Apenas administradores podem gerenciar convites.');
    err.status = 403;
    throw err;
  }

  return { user: userData.user, profile };
}

function siteUrl() {
  return inviteRedirectUrl();
}

async function sendInviteEmail(admin, email, role, nome) {
  const displayName = (nome || email.split('@')[0]).trim();
  const { error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: siteUrl(),
    data: { role, full_name: displayName },
  });

  if (error) throw error;
}

async function fetchConvite(admin, id) {
  const { data, error } = await admin.from('convites').select('*').eq('id', id).single();
  if (error || !data) {
    const err = new Error('Convite não encontrado.');
    err.status = 404;
    throw err;
  }
  return data;
}

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    return res.status(204).end();
  }

  if (!['POST', 'PATCH', 'DELETE'].includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!token) {
      return res.status(401).json({ error: 'Não autenticado.' });
    }

    const { userClient, admin } = getSupabaseClients();
    await assertAdmin(userClient, admin, token);

    const body = readBody(req);
    const id = Number(body.id);

    if (!id) {
      return res.status(400).json({ error: 'Informe o id do convite.' });
    }

    const convite = await fetchConvite(admin, id);

    if (convite.status !== 'pendente') {
      return res.status(400).json({ error: 'Só convites pendentes podem ser editados ou removidos.' });
    }

    if (req.method === 'DELETE') {
      await deleteAuthUserIfUnconfirmed(admin, convite.email);

      const { error } = await admin.from('convites').delete().eq('id', id);
      if (error) {
        return res.status(500).json({
          error: userFacingError(error.message, 'Falha ao remover convite.'),
        });
      }

      return res.status(200).json({ message: 'Convite removido.' });
    }

    if (req.method === 'POST' && body.action === 'resend') {
      await deleteAuthUserIfUnconfirmed(admin, convite.email);
      await sendInviteEmail(admin, convite.email, convite.role, convite.nome);

      return res.status(200).json({
        convite: mapConviteRow(convite),
        message: 'Convite reenviado por e-mail.',
      });
    }

    if (req.method === 'POST') {
      return res.status(400).json({ error: 'Ação não reconhecida.' });
    }

    // PATCH — atualizar e-mail e/ou role
    const nextEmail = body.email ? String(body.email).trim().toLowerCase() : convite.email;
    const nextRole = body.role || convite.role;
    const nextNome = body.nome ? String(body.nome).trim() : convite.nome;

    if (!nextEmail.includes('@')) {
      return res.status(400).json({ error: 'E-mail inválido.' });
    }

    const emailChanged = nextEmail !== convite.email;
    const roleChanged = nextRole !== convite.role;
    const nomeChanged = nextNome && nextNome !== convite.nome;

    if (!emailChanged && !roleChanged && !nomeChanged) {
      return res.status(200).json({
        convite: mapConviteRow(convite),
        message: 'Nada alterado.',
      });
    }

    if (emailChanged) {
      await deleteAuthUserIfUnconfirmed(admin, convite.email);
    }

    const { data: updated, error: updateError } = await admin
      .from('convites')
      .update({ email: nextEmail, role: nextRole, nome: nextNome })
      .eq('id', id)
      .select('*')
      .single();

    if (updateError) {
      return res.status(500).json({
        error: userFacingError(updateError.message, 'Falha ao atualizar convite.'),
      });
    }

    if (emailChanged) {
      await sendInviteEmail(admin, nextEmail, nextRole, nextNome);
    }

    return res.status(200).json({
      convite: mapConviteRow(updated),
      message: emailChanged
        ? 'Convite atualizado e e-mail enviado para o novo endereço.'
        : 'Permissão do convite atualizada.',
    });
  } catch (err) {
    const status = err.status || 500;
    return res.status(status).json({
      error: userFacingError(err.message, 'Não foi possível gerenciar o convite.'),
    });
  }
};
