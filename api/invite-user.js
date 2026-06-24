/**
 * POST /api/invite-user
 * Envia convite real via Supabase Auth (service role — só no servidor Vercel).
 *
 * Headers: Authorization: Bearer <access_token do usuário admin>
 * Body: { email, role, convidado_por, nome }
 */
const { createClient } = require('@supabase/supabase-js');
const {
  deleteAuthUserIfUnconfirmed,
  findUserByEmail,
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

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (!token) {
      return res.status(401).json({ error: 'Não autenticado.' });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const anonKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !anonKey || !serviceKey) {
      return res.status(500).json({ error: userFacingError('', 'Serviço indisponível no momento.') });
    }

    const userClient = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: userData, error: userErr } = await userClient.auth.getUser(token);
    if (userErr || !userData.user) {
      return res.status(401).json({ error: 'Sessão inválida. Faça login novamente.' });
    }

    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: profile } = await admin
      .from('profiles')
      .select('role, full_name')
      .eq('id', userData.user.id)
      .single();

    if (profile?.role !== 'admin') {
      return res.status(403).json({ error: 'Apenas administradores podem convidar.' });
    }

    const body = readBody(req);
    const nome = String(body.nome || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const role = body.role || 'leitor';
    const convidadoPor = body.convidado_por || profile.full_name || 'Admin';

    if (!nome) {
      return res.status(400).json({ error: 'Informe o nome da pessoa.' });
    }

    if (!email.includes('@')) {
      return res.status(400).json({ error: 'E-mail inválido.' });
    }

    const existingUser = await findUserByEmail(admin, email);
    if (existingUser?.email_confirmed_at) {
      return res.status(400).json({
        error: 'Este e-mail já possui acesso ao Smart Finances.',
      });
    }

    const { data: profileByEmail } = await admin
      .from('profiles')
      .select('id')
      .ilike('email', email)
      .maybeSingle();

    if (profileByEmail) {
      return res.status(400).json({
        error: 'Este e-mail já possui acesso ao Smart Finances.',
      });
    }

    const { data: existingConvite } = await admin
      .from('convites')
      .select('*')
      .ilike('email', email)
      .order('criado_em', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingConvite?.status === 'aceito') {
      return res.status(400).json({
        error: 'Este e-mail já possui acesso ao Smart Finances.',
      });
    }

    const siteUrl = inviteRedirectUrl();
    let convite = existingConvite;

    if (existingConvite?.status === 'pendente') {
      const { data: updated, error: updateError } = await admin
        .from('convites')
        .update({
          nome,
          role,
          convidado_por: convidadoPor,
          invited_by: userData.user.id,
        })
        .eq('id', existingConvite.id)
        .select('*')
        .single();

      if (updateError) {
        return res.status(500).json({
          error: userFacingError(updateError.message, 'Não foi possível atualizar o convite.'),
        });
      }

      convite = updated;
    } else {
      const { data: inserted, error: conviteError } = await admin
        .from('convites')
        .insert({
          nome,
          email,
          role,
          status: 'pendente',
          convidado_por: convidadoPor,
          invited_by: userData.user.id,
        })
        .select('*')
        .single();

      if (conviteError) {
        return res.status(500).json({
          error: userFacingError(conviteError.message, 'Não foi possível registrar o convite.'),
        });
      }

      convite = inserted;
    }

    await deleteAuthUserIfUnconfirmed(admin, email);

    const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: siteUrl,
      data: { role, full_name: nome },
    });

    if (inviteError) {
      if (!existingConvite) {
        await admin.from('convites').delete().eq('id', convite.id);
      }
      return res.status(400).json({
        error: userFacingError(inviteError.message, 'Não foi possível enviar o convite.'),
      });
    }

    const { data: conviteAtualizado } = await admin
      .from('convites')
      .update({ status: 'aceito' })
      .eq('id', convite.id)
      .select('*')
      .single();

    const finalConvite = conviteAtualizado ?? convite;

    return res.status(200).json({
      convite: mapConviteRow(finalConvite, nome),
      message: existingConvite?.status === 'pendente'
        ? 'Convite reenviado por e-mail.'
        : 'Convite enviado por e-mail.',
    });
  } catch (err) {
    return res.status(500).json({
      error: userFacingError(err.message, 'Não foi possível enviar o convite.'),
    });
  }
};
