/**
 * DELETE /api/membro — remove membro (Auth + profile), somente admin
 * Body: { id: uuid }
 */
const { createClient } = require('@supabase/supabase-js');

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
    res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
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
      return res.status(500).json({ error: 'Serviço indisponível no momento.' });
    }

    const userClient = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const admin = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: userData, error: userErr } = await userClient.auth.getUser(token);
    if (userErr || !userData.user) {
      return res.status(401).json({ error: 'Sessão inválida. Faça login novamente.' });
    }

    const { data: profile } = await admin
      .from('profiles')
      .select('role')
      .eq('id', userData.user.id)
      .single();

    if (profile?.role !== 'admin') {
      return res.status(403).json({ error: 'Apenas administradores podem remover membros.' });
    }

    const targetId = String(readBody(req).id || '').trim();
    if (!targetId) {
      return res.status(400).json({ error: 'Informe o membro a remover.' });
    }

    if (targetId === userData.user.id) {
      return res.status(400).json({ error: 'Você não pode remover a própria conta aqui.' });
    }

    const { error: authError } = await admin.auth.admin.deleteUser(targetId);
    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    await admin.from('profiles').delete().eq('id', targetId);

    return res.status(200).json({ message: 'Membro removido.' });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Erro interno.' });
  }
};
