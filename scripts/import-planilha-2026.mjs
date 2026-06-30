/**
 * Gera db.json a partir da planilha 2026 (fonte: planilha-2026-data.mjs).
 *
 * Uso: node scripts/import-planilha-2026.mjs
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DESPESAS, RECEITAS } from './planilha-2026-data.mjs';

const YEAR = 2026;
const CREATOR = 'Importação Excel';

function lastDayOfMonth(month) {
  return new Date(YEAR, month, 0).getDate();
}

function dateIso(month, day) {
  const safeDay = Math.min(day, lastDayOfMonth(month));
  return `${YEAR}-${String(month).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;
}

function statusFromMark(mark) {
  return mark === 'x' ? 'pendente' : 'pago';
}

/** @param {import('./planilha-2026-data.mjs').DespesaRow} row */
function despesaRows(row) {
  const out = [];
  row.values.forEach((value, i) => {
    if (value == null || value <= 0) return;
    const mark = row.marks[i] ?? 'ok';
    out.push({
      data: dateIso(i + 1, row.day),
      descricao: row.descricao,
      categoria: row.categoria,
      valor: value,
      status: statusFromMark(mark),
      criado_por: CREATOR,
    });
  });
  return out;
}

/** @param {import('./planilha-2026-data.mjs').ReceitaRow} row */
function receitaRows(row) {
  const out = [];
  row.values.forEach((valor, i) => {
    if (!valor || valor <= 0) return;
    const month = i + 1;
    out.push({
      data: dateIso(month, lastDayOfMonth(month)),
      descricao: row.descricao,
      categoria: row.categoria,
      valor,
      status: 'pago',
      criado_por: CREATOR,
    });
  });
  return out;
}

const transactions = [
  ...DESPESAS.flatMap(despesaRows),
  ...RECEITAS.flatMap(receitaRows),
].sort((a, b) => a.data.localeCompare(b.data) || a.descricao.localeCompare(b.descricao));

let id = 1;
const db = {
  transactions: transactions.map((t) => ({ id: id++, ...t })),
  investimentos: [],
  ativos: [],
  usuarios: [],
  convites: [],
};

writeFileSync(join(process.cwd(), 'db.json'), `${JSON.stringify(db, null, 2)}\n`, 'utf8');
console.log(`✓ db.json — ${db.transactions.length} transações`);
