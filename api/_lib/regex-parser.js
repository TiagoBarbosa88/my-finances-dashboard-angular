/**
 * Fast path PT-BR — evita LLM em frases simples.
 * Ex.: "gastei 250 no mercado", "recebi 5000 de salário"
 */

const RECEITA_CATEGORIES = ['Salário', 'Décimo Terceiro', 'Férias', 'Bônus', 'Renda Extra', 'Outros'];
const DESPESA_CATEGORIES = [
  'Moradia',
  'Alimentação',
  'Transporte',
  'Saúde',
  'Educação',
  'Lazer',
  'Investimento',
  'Outros',
];

const EXPENSE_HINTS = {
  mercado: 'Alimentação',
  supermercado: 'Alimentação',
  alimentacao: 'Alimentação',
  alimentação: 'Alimentação',
  uber: 'Transporte',
  gasolina: 'Transporte',
  transporte: 'Transporte',
  aluguel: 'Moradia',
  moradia: 'Moradia',
  farmacia: 'Saúde',
  farmácia: 'Saúde',
  saude: 'Saúde',
  saúde: 'Saúde',
  escola: 'Educação',
  educacao: 'Educação',
  educação: 'Educação',
  lazer: 'Lazer',
  investimento: 'Investimento',
};

const INCOME_HINTS = {
  salario: 'Salário',
  salário: 'Salário',
  ferias: 'Férias',
  férias: 'Férias',
  bonus: 'Bônus',
  bônus: 'Bônus',
  decimo: 'Décimo Terceiro',
  décimo: 'Décimo Terceiro',
  plr: 'Bônus',
  renda: 'Renda Extra',
};

function parseAmount(raw) {
  if (!raw) return null;
  const normalized = String(raw)
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^\d.]/g, '');
  const value = parseFloat(normalized);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function inferCategory(text, tipo) {
  const lower = text.toLowerCase();
  const hints = tipo === 'receita' ? INCOME_HINTS : EXPENSE_HINTS;

  for (const [hint, category] of Object.entries(hints)) {
    if (lower.includes(hint)) return category;
  }

  return tipo === 'receita' ? 'Outros' : 'Outros';
}

function extractDescription(text, tipo) {
  const cleaned = text
    .replace(/^(gastei|paguei|comprei|recebi|ganhei|entrada de|despesa de|receita de)\s+/i, '')
    .replace(/\d+([.,]\d+)?/g, '')
    .replace(/\b(no|na|em|de|do|da|com|por|reais|r\$)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleaned.length >= 2) return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  return tipo === 'receita' ? 'Receita' : 'Despesa';
}

function parseTransactionText(text, referenceDate = new Date()) {
  const trimmed = String(text || '').trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();
  const isReceita = /\b(recebi|ganhei|entrada|salario|salário|plr|ferias|férias|bonus|bônus)\b/.test(lower);
  const isDespesa = /\b(gastei|paguei|comprei|despesa|gasto)\b/.test(lower);

  if (!isReceita && !isDespesa) return null;

  const amountMatch = trimmed.match(/(\d{1,3}(?:\.\d{3})*(?:,\d{2})?|\d+(?:[.,]\d{1,2})?)/);
  const valor = parseAmount(amountMatch?.[1]);
  if (!valor) return null;

  const tipo = isReceita && !isDespesa ? 'receita' : isDespesa ? 'despesa' : 'receita';
  const categoria = inferCategory(trimmed, tipo);
  const descricao = extractDescription(trimmed, tipo);

  const categories = tipo === 'receita' ? RECEITA_CATEGORIES : DESPESA_CATEGORIES;
  if (!categories.includes(categoria)) return null;

  const data = referenceDate.toISOString().slice(0, 10);

  return {
    tipo,
    categoria,
    valor,
    descricao,
    data,
    status: 'pago',
    source: 'regex',
  };
}

module.exports = {
  parseTransactionText,
  RECEITA_CATEGORIES,
  DESPESA_CATEGORIES,
};
