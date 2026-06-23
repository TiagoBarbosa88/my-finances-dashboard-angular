/**
 * Gera SQL de seed a partir de db.json para o Supabase.
 *
 * Uso:
 *   node scripts/generate-supabase-seed.mjs
 *   node scripts/generate-supabase-seed.mjs --email tiagobarbosa.dev@email.com
 *
 * Cole o arquivo gerado em docs/supabase-seed.sql no SQL Editor do Supabase
 * (projeto onde o usuário Auth já existe).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const dbPath = join(root, 'db.json');
const outPath = join(root, 'docs/supabase-seed.sql');

const emailArg = process.argv.find((a) => a.startsWith('--email='));
const ownerEmail = emailArg?.split('=')[1] ?? 'tiagobarbosa.dev@email.com';

/** Mapeia criado_por do JSON → e-mail do profile no Supabase. */
const CREATOR_EMAIL = {
  Tiago: ownerEmail,
  Giselle: ownerEmail,
  Marina: ownerEmail,
  'Importação Excel': ownerEmail,
};

const TARGET_METAS = [
  { tipo: 'Ações', target_percent: 50 },
  { tipo: 'FIIs', target_percent: 25 },
  { tipo: 'ETFs', target_percent: 25 },
  { tipo: 'Tesouro Direto', target_percent: 0 },
];

function sqlStr(value) {
  return `'${String(value ?? '').replace(/'/g, "''")}'`;
}

function userIdSubquery(criadoPor) {
  const email = CREATOR_EMAIL[criadoPor] ?? ownerEmail;
  return `(SELECT id FROM public.profiles WHERE email = ${sqlStr(email)} LIMIT 1)`;
}

function chunk(array, size) {
  const out = [];
  for (let i = 0; i < array.length; i += size) {
    out.push(array.slice(i, i + size));
  }
  return out;
}

const db = JSON.parse(readFileSync(dbPath, 'utf8'));

const lines = [
  '-- ============================================================',
  '-- My Finances Dash — Seed a partir de db.json',
  `-- Dono principal: ${ownerEmail}`,
  '-- Rode DEPOIS do schema (seção 4 do SUPABASE-SETUP.md)',
  '-- e DEPOIS de criar o usuário em Authentication.',
  '-- ============================================================',
  '',
  `-- Confirme que o profile existe:`,
  `SELECT id, email, role FROM public.profiles WHERE email = ${sqlStr(ownerEmail)};`,
  '',
  '-- Limpa dados anteriores deste seed (opcional — descomente se quiser reimportar)',
  '-- TRUNCATE public.transactions, public.ativos, public.target_metas RESTART IDENTITY CASCADE;',
  '',
];

// ─── transactions ───────────────────────────────────────────────────────────
lines.push('-- ─── Lançamentos (190) ────────────────────────────────────────');

for (const batch of chunk(db.transactions, 50)) {
  const values = batch
    .map((t) => {
      const uid = userIdSubquery(t.criado_por);
      return `  (${uid}, ${sqlStr(t.data)}, ${sqlStr(t.descricao)}, ${sqlStr(t.categoria)}, ${Number(t.valor)}, ${sqlStr(t.status)}, ${sqlStr(t.criado_por)})`;
    })
    .join(',\n');

  lines.push(
    'INSERT INTO public.transactions (user_id, data, descricao, categoria, valor, status, criado_por)',
    'VALUES',
    values + ';',
    '',
  );
}

// ─── ativos ─────────────────────────────────────────────────────────────────
lines.push('-- ─── Carteira — ativos (8) ───────────────────────────────────');

const ativoValues = db.ativos
  .map((a) => {
    const uid = userIdSubquery('Tiago');
    const score = a.score != null ? Number(a.score) : 'NULL';
    const rent = a.rentabilidadePct != null ? Number(a.rentabilidadePct) : 'NULL';
    return `  (${uid}, ${sqlStr(a.ticker)}, ${sqlStr(a.tipo)}, ${sqlStr(a.setor ?? '')}, ${Number(a.qtd)}, ${Number(a.precoMedio)}, ${Number(a.precoAtual)}, ${rent}, ${score})`;
  })
  .join(',\n');

lines.push(
  'INSERT INTO public.ativos (user_id, ticker, tipo, setor, qtd, preco_medio, preco_atual, rentabilidade_pct, score)',
  'VALUES',
  ativoValues,
  'ON CONFLICT (user_id, ticker) DO UPDATE SET',
  '  qtd = EXCLUDED.qtd,',
  '  preco_medio = EXCLUDED.preco_medio,',
  '  preco_atual = EXCLUDED.preco_atual,',
  '  rentabilidade_pct = EXCLUDED.rentabilidade_pct,',
  '  score = EXCLUDED.score,',
  '  updated_at = now();',
  '',
);

// ─── target_metas ───────────────────────────────────────────────────────────
lines.push('-- ─── Metas de alocação ───────────────────────────────────────');

const metaValues = TARGET_METAS.map((m) => {
  const uid = userIdSubquery('Tiago');
  return `  (${uid}, ${sqlStr(m.tipo)}, ${m.target_percent})`;
}).join(',\n');

lines.push(
  'INSERT INTO public.target_metas (user_id, tipo, target_percent)',
  'VALUES',
  metaValues,
  'ON CONFLICT (user_id, tipo) DO UPDATE SET',
  '  target_percent = EXCLUDED.target_percent,',
  '  updated_at = now();',
  '',
);

lines.push(
  '-- db.json "investimentos" (20) são snapshots de carteira, não lançamentos compra/venda —',
  '-- não importados para public.investimentos.',
  '',
  'SELECT',
  "  (SELECT count(*) FROM public.transactions) AS transactions,",
  "  (SELECT count(*) FROM public.ativos) AS ativos,",
  "  (SELECT count(*) FROM public.target_metas) AS target_metas;",
);

writeFileSync(outPath, lines.join('\n'), 'utf8');
console.log(`[seed] Gerado ${outPath}`);
console.log(`[seed] Owner: ${ownerEmail} · ${db.transactions.length} transactions · ${db.ativos.length} ativos`);
