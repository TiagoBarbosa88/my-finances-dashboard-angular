const { RECEITA_CATEGORIES, DESPESA_CATEGORIES } = require('./regex-parser');

const SYSTEM_PROMPT = `Você extrai lançamentos financeiros de mensagens em português.
Responda APENAS com JSON válido, sem markdown, no formato:
{"tipo":"receita"|"despesa","categoria":string,"valor":number,"descricao":string,"data":"YYYY-MM-DD","status":"pago"|"pendente"}

Categorias de receita: ${RECEITA_CATEGORIES.join(', ')}
Categorias de despesa: ${DESPESA_CATEGORIES.join(', ')}
Valor sempre positivo (number). Data ISO se não informada use hoje.`;

async function parseWithOpenAI(text, referenceDate = new Date()) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY não configurada.');
  }

  const today = referenceDate.toISOString().slice(0, 10);
  const userPrompt = `Mensagem: "${text}"\nData de referência (hoje): ${today}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenAI error: ${response.status} ${errText}`);
  }

  const payload = await response.json();
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error('Resposta vazia da OpenAI.');

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('JSON inválido retornado pela OpenAI.');
  }

  const valor = Number(parsed.valor);
  if (!Number.isFinite(valor) || valor <= 0) {
    throw new Error('Valor inválido no parse.');
  }

  const tipo = parsed.tipo === 'receita' ? 'receita' : 'despesa';
  const allowed = tipo === 'receita' ? RECEITA_CATEGORIES : DESPESA_CATEGORIES;
  const categoria = allowed.includes(parsed.categoria) ? parsed.categoria : 'Outros';

  return {
    tipo,
    categoria,
    valor,
    descricao: String(parsed.descricao || (tipo === 'receita' ? 'Receita' : 'Despesa')).slice(0, 200),
    data: /^\d{4}-\d{2}-\d{2}$/.test(parsed.data) ? parsed.data : today,
    status: parsed.status === 'pendente' ? 'pendente' : 'pago',
    source: 'llm',
  };
}

module.exports = { parseWithOpenAI };
