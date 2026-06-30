/**
 * Gera SQL de seed a partir de db.json para o Supabase.
 *
 * Uso:
 *   npm run seed:sql
 *   node scripts/generate-supabase-seed.mjs --email=tiagobarbosa.dev@gmail.com
 *   node scripts/generate-supabase-seed.mjs --email=... --uuid=50b94089-79f2-4a42-893d-be8fe26c26df
 *
 * Cole docs/supabase-seed.sql no SQL Editor do Supabase.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const dbPath = join(root, 'db.json');
const outPath = join(root, 'docs/supabase-seed.sql');

const emailArg = process.argv.find((a) => a.startsWith('--email='));
const uuidArg = process.argv.find((a) => a.startsWith('--uuid='));
const ownerEmail = emailArg?.split('=')[1] ?? 'tiagobarbosa.dev@gmail.com';
const ownerUuid = uuidArg?.split('=')[1] ?? '';

/** Mapeia criado_por do JSON → e-mail do profile no Supabase. */
const CREATOR_EMAIL = {
  Tiago: ownerEmail,
  Giselle: ownerEmail,
  Marina: ownerEmail,
  Você: ownerEmail,
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

/** UUID fixo (recomendado) ou subquery por e-mail. */
function userIdExpr() {
  if (ownerUuid) {
    return `'${ownerUuid}'::uuid`;
  }
  return `(SELECT id FROM public.profiles WHERE email = ${sqlStr(ownerEmail)} LIMIT 1)`;
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
  '-- Smart Finances — Seed a partir de db.json',
  `-- Dono: ${ownerEmail}`,
  ownerUuid ? `-- UUID: ${ownerUuid}` : '',
  '-- Rode DEPOIS do schema (SUPABASE-SETUP.md seção 4) e com usuário Auth criado.',
  '-- ============================================================',
  '',
  '-- 1) Confirme o profile (deve retornar 1 linha):',
  ownerUuid
    ? `SELECT id, email, role FROM public.profiles WHERE id = '${ownerUuid}';`
    : `SELECT id, email, role FROM public.profiles WHERE email = ${sqlStr(ownerEmail)};`,
  '',
  '-- 2) Aborta se o dono não existir (evita user_id NULL):',
  'DO $$',
  'DECLARE uid uuid;',
  'BEGIN',
  ownerUuid
    ? `  SELECT id INTO uid FROM public.profiles WHERE id = '${ownerUuid}'::uuid;`
    : `  SELECT id INTO uid FROM public.profiles WHERE email = ${sqlStr(ownerEmail)};`,
  "  IF uid IS NULL THEN",
  ownerUuid
    ? `    RAISE EXCEPTION 'Profile não encontrado para UUID ${ownerUuid}. Crie o usuário em Authentication primeiro.';`
    : `    RAISE EXCEPTION 'Profile não encontrado para e-mail ${ownerEmail}. Confira Authentication → Users.';`,
  '  END IF;',
  'END $$;',
  '',
  '-- 3) Limpa tentativa anterior (descomente se reimportar):',
  '-- DELETE FROM public.transactions WHERE user_id = ' + userIdExpr() + ';',
  '-- (ativos/target_metas usam ON CONFLICT abaixo)',
  '',
].filter(Boolean);

// ─── transactions ───────────────────────────────────────────────────────────
lines.push('-- ─── Lançamentos (' + db.transactions.length + ') ────────────────────────────────────────');

for (const batch of chunk(db.transactions, 50)) {
  const values = batch
    .map((t) => {
      const uid = userIdExpr();
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
lines.push('-- ─── Carteira — ativos (' + db.ativos.length + ') ───────────────────────────────────');

if (db.ativos.length > 0) {
  const ativoValues = db.ativos
    .map((a) => {
      const uid = userIdExpr();
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
} else {
  lines.push('-- (nenhum ativo no db.json — carteira vazia)', '');
}

// ─── target_metas ───────────────────────────────────────────────────────────
lines.push('-- ─── Metas de alocação ───────────────────────────────────────');

const metaValues = TARGET_METAS.map((m) => {
  const uid = userIdExpr();
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
  '-- db.json "investimentos" (20) são snapshots — não importados para public.investimentos.',
  '',
  'SELECT',
  "  (SELECT count(*) FROM public.transactions) AS transactions,",
  "  (SELECT count(*) FROM public.ativos) AS ativos,",
  "  (SELECT count(*) FROM public.target_metas) AS target_metas;",
);

writeFileSync(outPath, lines.join('\n'), 'utf8');
console.log(`[seed] Gerado ${outPath}`);
console.log(
  `[seed] Owner: ${ownerEmail}` +
    (ownerUuid ? ` · uuid=${ownerUuid}` : '') +
    ` · ${db.transactions.length} transactions · ${db.ativos.length} ativos`,
);
