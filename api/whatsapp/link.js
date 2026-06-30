/**
 * POST /api/whatsapp/link
 * Gera código de vínculo, consulta status ou desvincula WhatsApp.
 */
const { createAdminClient, createUserClient, readBody } = require('../_lib/supabase-admin');
const { consumeRateLimit } = require('../_lib/rate-limit');
const { normalizePhone, SESSION_TTL_MS } = require('../_lib/whatsapp-orchestrator');
const { userFacingError } = require('../_lib/user-message');

function randomCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
    return res.status(204).end();
  }

  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace(/^Bearer\s+/i, '');
    if (!token) {
      return res.status(401).json({ error: 'Não autenticado.' });
    }

    const { client, getUser } = createUserClient(token);
    const { data: userData, error: userErr } = await getUser();
    if (userErr || !userData.user) {
      return res.status(401).json({ error: 'Sessão inválida. Faça login novamente.' });
    }

    const admin = createAdminClient();
    const userId = userData.user.id;

    const { data: profile } = await admin
      .from('profiles')
      .select('role, full_name, workspace_id')
      .eq('id', userId)
      .single();

    if (profile?.role !== 'admin') {
      return res.status(403).json({ error: 'Apenas administradores podem vincular WhatsApp.' });
    }

    if (req.method === 'GET') {
      const { data: link } = await admin
        .from('whatsapp_links')
        .select('phone_e164, verified_at, link_code_expires_at')
        .eq('user_id', userId)
        .maybeSingle();

      return res.status(200).json({
        linked: Boolean(link?.verified_at && link?.phone_e164),
        phone: link?.phone_e164 || null,
        pendingCode: link?.link_code_expires_at
          ? new Date(link.link_code_expires_at).getTime() > Date.now()
          : false,
      });
    }

    if (req.method === 'DELETE') {
      await admin.from('whatsapp_sessions').delete().eq('user_id', userId);
      await admin.from('whatsapp_links').delete().eq('user_id', userId);
      return res.status(200).json({ ok: true, message: 'WhatsApp desvinculado.' });
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const rate = consumeRateLimit(`whatsapp-link:${userId}`, { limit: 5, windowMs: 120_000 });
    if (!rate.allowed) {
      return res.status(429).json({
        error: `Aguarde ${rate.retryAfterSec} segundos antes de gerar outro código.`,
      });
    }

    const body = readBody(req);
    const phoneInput = body.phone ? normalizePhone(body.phone) : null;

    const code = randomCode();
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
    const workspaceId = profile.workspace_id || userId;

    const { data: existing } = await admin
      .from('whatsapp_links')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    const row = {
      user_id: userId,
      workspace_id: workspaceId,
      phone_e164: existing?.phone_e164 && body.keepPhone ? existing.phone_e164 : phoneInput,
      link_code: code,
      link_code_expires_at: expiresAt,
      verified_at: null,
      updated_at: new Date().toISOString(),
    };

    if (existing) {
      const { error } = await admin.from('whatsapp_links').update(row).eq('id', existing.id);
      if (error) throw error;
    } else {
      const { error } = await admin.from('whatsapp_links').insert(row);
      if (error) throw error;
    }

    return res.status(200).json({
      code,
      expiresAt,
      message:
        `Código ${code} gerado. Envie este código no WhatsApp vinculado à Evolution API ` +
        `(válido por 30 min).`,
    });
  } catch (err) {
    console.error('[whatsapp/link] erro:', err);
    return res.status(500).json({
      error: userFacingError(err.message, 'Não foi possível processar vínculo WhatsApp.'),
    });
  }
};
