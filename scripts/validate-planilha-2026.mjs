/**
 * Valida db.json contra a planilha 2026.
 * Uso: npm run validate:planilha
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { DESPESAS, RECEITAS, MONTHS } from './planilha-2026-data.mjs';

const YEAR = 2026;

function lastDayOfMonth(month) {
  return new Date(YEAR, month, 0).getDate();
}

function expectedDate(month, day, isReceita) {
  const d = isReceita ? lastDayOfMonth(month) : Math.min(day, lastDayOfMonth(month));
  return `${YEAR}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function buildExpected() {
  const expected = [];

  for (const row of DESPESAS) {
    row.values.forEach((value, i) => {
      if (value == null || value <= 0) return;
      const mark = row.marks[i] ?? 'ok';
      expected.push({
        key: `${row.descricao}|${i + 1}`,
        data: expectedDate(i + 1, row.day, false),
        descricao: row.descricao,
        categoria: row.categoria,
        valor: value,
        status: mark === 'x' ? 'pendente' : 'pago',
        mes: MONTHS[i],
      });
    });
  }

  for (const row of RECEITAS) {
    row.values.forEach((value, i) => {
      if (!value || value <= 0) return;
      expected.push({
        key: `${row.descricao}|${i + 1}`,
        data: expectedDate(i + 1, 1, true),
        descricao: row.descricao,
        categoria: row.categoria,
        valor: value,
        status: 'pago',
        mes: MONTHS[i],
      });
    });
  }

  return expected;
}

const db = JSON.parse(readFileSync(join(process.cwd(), 'db.json'), 'utf8'));
const expected = buildExpected();
const actual = db.transactions;

const errors = [];
const expectedKeys = new Set(expected.map((e) => e.key));
const actualKeys = new Set();

for (const exp of expected) {
  const match = actual.find(
    (t) =>
      t.descricao === exp.descricao &&
      t.data === exp.data &&
      Math.abs(Number(t.valor) - exp.valor) < 0.01,
  );

  if (!match) {
    errors.push(`FALTANDO: ${exp.mes} ${exp.descricao} ${exp.valor} (${exp.data}) status=${exp.status}`);
    continue;
  }

  actualKeys.add(`${exp.descricao}|${exp.data}|${exp.valor}`);

  if (match.categoria !== exp.categoria) {
    errors.push(`CATEGORIA: ${exp.descricao} ${exp.data} esperado=${exp.categoria} atual=${match.categoria}`);
  }
  if (match.status !== exp.status) {
    errors.push(`STATUS: ${exp.descricao} ${exp.data} esperado=${exp.status} atual=${match.status}`);
  }
}

for (const t of actual) {
  const exp = expected.find(
    (e) =>
      e.descricao === t.descricao &&
      e.data === t.data &&
      Math.abs(Number(t.valor) - e.valor) < 0.01,
  );
  if (!exp) {
    errors.push(`EXTRA no db.json: ${t.data} ${t.descricao} R$ ${t.valor} (${t.status})`);
  }
}

console.log(`Planilha: ${expected.length} lançamentos esperados`);
console.log(`db.json:  ${actual.length} transações`);

if (errors.length === 0) {
  console.log('✓ Validação OK — todos os valores batem com a planilha.');
  process.exit(0);
}

console.error(`✗ ${errors.length} divergência(s):\n`);
for (const e of errors) console.error(`  - ${e}`);
process.exit(1);
