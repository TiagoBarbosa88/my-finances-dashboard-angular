/**
 * Cliente REST Evolution API — envio de texto.
 */

function getEvolutionConfig() {
  const baseUrl = (process.env.EVOLUTION_API_URL || '').replace(/\/$/, '');
  const apiKey = process.env.EVOLUTION_API_KEY || process.env.AUTHENTICATION_API_KEY || '';
  const instance = process.env.EVOLUTION_INSTANCE_NAME || 'smart-finances';

  return { baseUrl, apiKey, instance };
}

async function sendTextMessage(phoneE164, text) {
  const { baseUrl, apiKey, instance } = getEvolutionConfig();

  if (!baseUrl || !apiKey) {
    console.warn('[evolution] não configurado — mensagem não enviada:', text);
    return { ok: false, skipped: true };
  }

  const number = phoneE164.replace(/\D/g, '');
  const url = `${baseUrl}/message/sendText/${encodeURIComponent(instance)}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: apiKey,
    },
    body: JSON.stringify({
      number,
      text,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('[evolution] sendText failed:', response.status, errText);
    return { ok: false, error: errText };
  }

  return { ok: true };
}

module.exports = { sendTextMessage, getEvolutionConfig };
