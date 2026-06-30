/**
 * POST /api/whatsapp/webhook
 * Recebe eventos da Evolution API e delega ao orquestrador.
 */
const { createAdminClient, readBody } = require('../_lib/supabase-admin');
const { handleInboundMessage } = require('../_lib/whatsapp-orchestrator');

function extractInboundPayload(body) {
  const data = body?.data ?? body;
  const key = data?.key ?? {};
  const message = data?.message ?? {};

  if (key.fromMe === true) return null;

  const phoneRaw =
    key.remoteJid?.replace(/@.*/, '') ||
    data?.sender?.replace(/@.*/, '') ||
    body?.from ||
    '';

  let text =
    message.conversation ||
    message.extendedTextMessage?.text ||
    message.imageMessage?.caption ||
    '';

  let audioUrl =
    message.audioMessage?.url ||
    message.pttMessage?.url ||
    null;

  if (!text && !audioUrl && typeof body?.text === 'string') {
    text = body.text;
  }

  if (!phoneRaw) return null;

  return { phoneRaw, text, audioUrl };
}

function validateWebhookSecret(req) {
  const expected = process.env.WHATSAPP_WEBHOOK_SECRET;
  if (!expected) return true;

  const header = req.headers['x-webhook-secret'] || req.headers['x-evolution-secret'];
  const query = req.query?.secret;
  return header === expected || query === expected;
}

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-webhook-secret, x-evolution-secret');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!validateWebhookSecret(req)) {
    return res.status(401).json({ error: 'Webhook não autorizado.' });
  }

  try {
    const body = readBody(req);
    const event = body?.event || body?.type || '';

    if (event && !/messages\.upsert|message/i.test(event)) {
      return res.status(200).json({ ok: true, skipped: true });
    }

    const inbound = extractInboundPayload(body);
    if (!inbound) {
      return res.status(200).json({ ok: true, skipped: true });
    }

    const admin = createAdminClient();
    const replyText = await handleInboundMessage(admin, inbound);

    return res.status(200).json({ ok: true, reply: typeof replyText === 'string' ? replyText : null });
  } catch (err) {
    console.error('[whatsapp/webhook] erro:', err);
    return res.status(500).json({ error: 'Falha ao processar webhook.' });
  }
};
