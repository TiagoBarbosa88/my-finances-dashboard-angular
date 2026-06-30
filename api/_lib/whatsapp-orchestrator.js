const { parseTransactionText } = require('./regex-parser');
const { parseWithOpenAI } = require('./transaction-parser');
const { transcribeAudio } = require('./transcribe-audio');
const { sendTextMessage } = require('./evolution-client');

const SESSION_TTL_MS = 30 * 60 * 1000;

function normalizePhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('55') && digits.length >= 12) return `+${digits}`;
  if (digits.length >= 10 && digits.length <= 11) return `+55${digits}`;
  return digits.startsWith('+') ? raw : `+${digits}`;
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

function isAffirmative(text) {
  return /^(sim|s|confirmo|confirmar|ok|pode|salvar|yes)$/i.test(String(text || '').trim());
}

function isNegative(text) {
  return /^(nao|não|n|cancelar|cancela|stop|pare)$/i.test(String(text || '').trim());
}

function isHelp(text) {
  return /^(ajuda|help|\?)$/i.test(String(text || '').trim());
}

function isBalance(text) {
  return /^(saldo|resumo|extrato)$/i.test(String(text || '').trim());
}

async function logMessage(admin, phone, direction, body) {
  await admin.from('whatsapp_message_log').insert({
    phone_e164: phone,
    direction,
    body: String(body).slice(0, 4000),
  });
}

async function reply(admin, phone, text) {
  await logMessage(admin, phone, 'out', text);
  await sendTextMessage(phone, text);
  return text;
}

async function getSession(admin, phone) {
  const { data } = await admin
    .from('whatsapp_sessions')
    .select('*')
    .eq('phone_e164', phone)
    .maybeSingle();

  if (!data) return null;
  if (new Date(data.expires_at).getTime() < Date.now()) {
    await admin.from('whatsapp_sessions').delete().eq('phone_e164', phone);
    return null;
  }
  return data;
}

async function saveSession(admin, phone, patch) {
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  const row = {
    phone_e164: phone,
    expires_at: expiresAt,
    updated_at: new Date().toISOString(),
    ...patch,
  };

  await admin.from('whatsapp_sessions').upsert(row, { onConflict: 'phone_e164' });
}

async function clearSession(admin, phone) {
  await admin.from('whatsapp_sessions').delete().eq('phone_e164', phone);
}

async function getVerifiedLink(admin, phone) {
  const { data: link } = await admin
    .from('whatsapp_links')
    .select('*')
    .eq('phone_e164', phone)
    .not('verified_at', 'is', null)
    .maybeSingle();

  if (!link) return null;

  const { data: profile } = await admin
    .from('profiles')
    .select('full_name, email')
    .eq('id', link.user_id)
    .maybeSingle();

  return { ...link, profiles: profile };
}

async function getPendingLinkByCode(admin, code) {
  const { data } = await admin
    .from('whatsapp_links')
    .select('*')
    .eq('link_code', code)
    .gt('link_code_expires_at', new Date().toISOString())
    .maybeSingle();

  return data;
}

function draftPreview(draft) {
  const tipoLabel = draft.tipo === 'receita' ? 'Receita' : 'Despesa';
  return (
    `${tipoLabel} ${formatCurrency(draft.valor)}\n` +
    `${draft.descricao} (${draft.categoria})\n` +
    `Data: ${draft.data} · Status: ${draft.status}\n\n` +
    `Salvar? Responda SIM ou NÃO.`
  );
}

async function parseMessage(text) {
  const regexResult = parseTransactionText(text);
  if (regexResult) return regexResult;
  return parseWithOpenAI(text);
}

async function insertTransaction(admin, link, draft) {
  const criadoPor = link.profiles?.full_name || 'WhatsApp';

  const { data, error } = await admin
    .from('transactions')
    .insert({
      user_id: link.user_id,
      data: draft.data,
      descricao: draft.descricao,
      categoria: draft.categoria,
      valor: draft.valor,
      status: draft.status,
      criado_por: criadoPor,
    })
    .select('id')
    .single();

  if (error) throw error;
  return data;
}

async function monthSummary(admin, userId) {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

  const { data } = await admin
    .from('transactions')
    .select('categoria, valor')
    .eq('user_id', userId)
    .gte('data', start)
    .lte('data', end);

  const receitaCats = ['Salário', 'Décimo Terceiro', 'Férias', 'Bônus', 'Renda Extra'];
  let receitas = 0;
  let despesas = 0;

  for (const row of data || []) {
    if (receitaCats.includes(row.categoria)) receitas += Number(row.valor);
    else despesas += Number(row.valor);
  }

  return { receitas, despesas, saldo: receitas - despesas };
}

/**
 * Orquestrador principal — processa uma mensagem inbound.
 */
async function handleInboundMessage(admin, { phoneRaw, text, audioUrl }) {
  const phone = normalizePhone(phoneRaw);
  if (!phone) {
    return { ok: false, error: 'Telefone inválido.' };
  }

  let messageText = String(text || '').trim();

  if (!messageText && audioUrl) {
    try {
      messageText = await transcribeAudio(audioUrl);
    } catch (err) {
      console.error('[orchestrator] whisper:', err);
      return reply(admin, phone, 'Não consegui entender o áudio. Tente enviar texto.');
    }
  }

  if (!messageText) {
    return reply(admin, phone, 'Envie um lançamento. Ex.: "gastei 250 no mercado".');
  }

  await logMessage(admin, phone, 'in', messageText);

  const link = await getVerifiedLink(admin, phone);
  const session = await getSession(admin, phone);

  if (isHelp(messageText)) {
    return reply(
      admin,
      phone,
      'Comandos:\n' +
        '• gastei 250 no mercado\n' +
        '• recebi 5000 salário\n' +
        '• saldo — resumo do mês\n' +
        '• cancelar — descarta rascunho\n' +
        '• ajuda — esta mensagem',
    );
  }

  if (isNegative(messageText) && session?.state === 'awaiting_confirm') {
    await clearSession(admin, phone);
    return reply(admin, phone, 'Lançamento cancelado.');
  }

  if (session?.state === 'awaiting_confirm') {
    if (isAffirmative(messageText)) {
      if (!link) {
        await clearSession(admin, phone);
        return reply(admin, phone, 'Conta não vinculada. Gere um código em Configurações.');
      }

      try {
        const saved = await insertTransaction(admin, link, session.draft);
        await clearSession(admin, phone);
        return reply(
          admin,
          phone,
          `Salvo (#${saved.id})! ${formatCurrency(session.draft.valor)} — ${session.draft.descricao}`,
        );
      } catch (err) {
        console.error('[orchestrator] insert:', err);
        await clearSession(admin, phone);
        return reply(admin, phone, 'Erro ao salvar. Tente novamente pelo app.');
      }
    }

    return reply(admin, phone, 'Responda SIM para confirmar ou NÃO para cancelar.');
  }

  if (!link) {
    const code = messageText.replace(/\D/g, '').slice(0, 6);
    if (code.length !== 6) {
      await saveSession(admin, phone, {
        user_id: null,
        state: 'awaiting_link_code',
        draft: null,
      });
      return reply(
        admin,
        phone,
        'Número não vinculado. Abra Configurações no app, gere um código de 6 dígitos e envie aqui.',
      );
    }

    const pending = await getPendingLinkByCode(admin, code);
    if (!pending) {
      return reply(admin, phone, 'Código inválido ou expirado. Gere um novo código no app.');
    }

    await admin
      .from('whatsapp_links')
      .update({
        phone_e164: phone,
        link_code: null,
        link_code_expires_at: null,
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', pending.id);

    await saveSession(admin, phone, {
      user_id: pending.user_id,
      state: 'idle',
      draft: null,
    });

    return reply(
      admin,
      phone,
      'WhatsApp vinculado! Envie lançamentos. Ex.: "gastei 120 na farmácia".',
    );
  }

  if (isBalance(messageText)) {
    const summary = await monthSummary(admin, link.user_id);
    return reply(
      admin,
      phone,
      `Resumo do mês:\nReceitas: ${formatCurrency(summary.receitas)}\n` +
        `Despesas: ${formatCurrency(summary.despesas)}\n` +
        `Saldo: ${formatCurrency(summary.saldo)}`,
    );
  }

  if (isNegative(messageText)) {
    await clearSession(admin, phone);
    return reply(admin, phone, 'Ok, nada foi salvo.');
  }

  try {
    const draft = await parseMessage(messageText);
    await saveSession(admin, phone, {
      user_id: link.user_id,
      state: 'awaiting_confirm',
      draft,
    });
    return reply(admin, phone, draftPreview(draft));
  } catch (err) {
    console.error('[orchestrator] parse:', err);
    return reply(
      admin,
      phone,
      'Não entendi. Ex.: "gastei 250 no mercado" ou "recebi 5000 salário".',
    );
  }
}

module.exports = {
  handleInboundMessage,
  normalizePhone,
  SESSION_TTL_MS,
};
