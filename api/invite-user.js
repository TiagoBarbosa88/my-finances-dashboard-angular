/**
 * POST /api/invite-user
 * Envia convite real via Supabase Auth (service role — só no servidor Vercel).
 *
 * Headers: Authorization: Bearer <access_token do usuário admin>
 * Body: { email, role, convidado_por }
 */
const { createClient } = require('@supabase/supabase-js');
const { inviteRedirectUrl } = require('./_lib/site-url');

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
      return res.status(500).json({ error: 'Supabase não configurado no servidor (Vercel env vars).' });
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
    const email = String(body.email || '').trim().toLowerCase();
    const role = body.role || 'leitor';
    const convidadoPor = body.convidado_por || profile.full_name || 'Admin';

    if (!email.includes('@')) {
      return res.status(400).json({ error: 'E-mail inválido.' });
    }

    const siteUrl = inviteRedirectUrl();

    const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
      redirectTo: siteUrl,
      data: { role, full_name: email.split('@')[0] },
    });

    if (inviteError) {
      return res.status(400).json({ error: inviteError.message });
    }

    const { data: convite, error: conviteError } = await admin
      .from('convites')
      .insert({
        email,
        role,
        status: 'pendente',
        convidado_por: convidadoPor,
        invited_by: userData.user.id,
      })
      .select('*')
      .single();

    if (conviteError) {
      return res.status(500).json({ error: conviteError.message });
    }

    const criadoEm = convite.criado_em?.includes('T')
      ? convite.criado_em.split('T')[0]
      : convite.criado_em;

    return res.status(200).json({
      convite: {
        id: convite.id,
        email: convite.email,
        role: convite.role,
        status: convite.status,
        criado_em: criadoEm,
        convidado_por: convite.convidado_por,
      },
      message: 'Convite enviado por e-mail.',
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Erro interno.' });
  }
};
