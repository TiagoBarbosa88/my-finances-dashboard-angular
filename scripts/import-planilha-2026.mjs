/**
 * Gera db.json a partir da planilha financeira 2026 (conta única do casal).
 *
 * Uso: node scripts/import-planilha-2026.mjs
 * Depois: npm run seed:sql -- --email=SEU_EMAIL --uuid=SEU_UUID
 */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const YEAR = 2026;
const CREATOR = 'Importação Excel';

/** @typedef {{ value: number | null; mark: 'ok' | 'x' | null }} MonthCell */

/**
 * @param {number} month 1–12
 * @param {number} day
 */
function dateIso(month, day) {
  const d = String(day).padStart(2, '0');
  const m = String(month).padStart(2, '0');
  return `${YEAR}-${m}-${d}`;
}

/** @param {number} month 1–12 */
function lastDayOfMonth(month) {
  return new Date(YEAR, month, 0).getDate();
}

/** @param {'ok' | 'x' | null | undefined} mark */
function statusFromMark(mark) {
  return mark === 'x' ? 'pendente' : 'pago';
}

/**
 * @param {string} descricao
 * @param {string} categoria
 * @param {number} day
 * @param {MonthCell[]} months 12 células (JAN–DEZ)
 */
function despesaRows(descricao, categoria, day, months) {
  const rows = [];
  months.forEach((cell, i) => {
    const month = i + 1;
    if (cell?.value == null || cell.value <= 0) return;
    rows.push({
      data: dateIso(month, day),
      descricao,
      categoria,
      valor: cell.value,
      status: statusFromMark(cell.mark),
      criado_por: CREATOR,
    });
  });
  return rows;
}

/**
 * @param {string} descricao
 * @param {string} categoria
 * @param {number[]} values 12 valores (0 = omitir)
 */
function receitaRows(descricao, categoria, values) {
  const rows = [];
  values.forEach((valor, i) => {
    if (!valor || valor <= 0) return;
    const month = i + 1;
    rows.push({
      data: dateIso(month, lastDayOfMonth(month)),
      descricao,
      categoria,
      valor,
      status: 'pago',
      criado_por: CREATOR,
    });
  });
  return rows;
}

/** @param {MonthCell | null} cell @returns {MonthCell} */
function cell(value, mark = 'ok') {
  if (value == null || value <= 0) return { value: null, mark: null };
  return { value, mark };
}

/** @param {(number|null)[]} values @param {('ok'|'x'|null)[]} marks */
function monthRow(values, marks) {
  return values.map((v, i) => {
    if (v == null || v <= 0) return { value: null, mark: null };
    return { value: v, mark: marks[i] ?? 'ok' };
  });
}

const transactions = [];
let id = 1;

const despesas = [
  despesaRows('Faculdade Giselle', 'Educação', 5, monthRow(
    [197.75, 143.46, 143.46, 145, 145, 145, 197.75, 190, 190, 190, 190, 190],
    ['ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'x', 'x', 'x', 'x', 'x'],
  )),
  despesaRows('Faculdade Tiago', 'Educação', 5, monthRow(
    [208.74, 318.26, 318.26, 318.26, 318.26, 318.26, 107, null, null, null, null, null],
    ['ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'ok', null, null, null, null, null],
  )),
  despesaRows('Garagem', 'Transporte', 5, monthRow(
    [170, 170, 170, 200, 200, 200, 200, 200, 200, 200, 200, 200],
    ['ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'x', 'x', 'x', 'x', 'x'],
  )),
  despesaRows('Seguro carro', 'Transporte', 5, monthRow(
    [276.34, 442, 171.5, 205.5, 166.5, 271.5, 214.5, 241.58, 241.58, 241.58, 241.58, 241.58],
    ['ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'x', 'x', 'x', 'x', 'x'],
  )),
  despesaRows('Água', 'Moradia', 1, monthRow(
    [null, null, null, null, null, null, 138.93, null, null, null, null, null],
    [null, null, null, null, null, null, 'ok', null, null, null, null, null],
  )),
  despesaRows('Luz', 'Moradia', 1, monthRow(
    [null, null, null, null, null, null, 241.75, null, null, null, null, null],
    [null, null, null, null, null, null, 'ok', null, null, null, null, null],
  )),
  despesaRows('Internet', 'Tecnologia', 10, monthRow(
    [99.9, 99.9, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100],
    ['ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'x', 'x', 'x', 'x', 'x'],
  )),
  despesaRows('Tio Luiz', 'Dependentes', 10, monthRow(
    [null, 230, 250, 250, 250, 250, 250, 250, 250, 250, 250, 250],
    [null, 'ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'x', 'x', 'x', 'x', 'x'],
  )),
  despesaRows('William', 'Dependentes', 30, monthRow(
    [350, 350, 350, 20350, null, null, null, null, null, null, null, null],
    ['ok', 'ok', 'ok', 'ok', null, null, null, null, null, null, null, null],
  )),
  despesaRows('Vovô Marcos', 'Dependentes', 1, monthRow(
    [null, null, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100],
    [null, null, 'ok', 'ok', 'ok', 'ok', 'ok', 'x', 'x', 'x', 'x', 'x'],
  )),
  despesaRows('Yago', 'Dependentes', 1, monthRow(
    [50, 50, 105, 50, 50, 50, 94, 50, 50, 50, 50, 50],
    ['ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'x', 'x', 'x', 'x', 'x'],
  )),
  despesaRows('Dentista', 'Dependentes', 1, monthRow(
    [null, null, null, null, 85, null, null, null, null, null, null, null],
    [null, null, null, null, 'ok', null, null, null, null, null, null, null],
  )),
  despesaRows('Santander', 'Outros', 1, monthRow(
    [250, 299.4, null, null, null, null, null, null, null, null, null, null],
    ['ok', 'ok', null, null, null, null, null, null, null, null, null, null],
  )),
  despesaRows('Nubank Giselle', 'Outros', 1, monthRow(
    [104, 70, 2533.85, 333.53, 325.54, 377.62, 412, 403.33, 290, null, null, null],
    ['ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'x', 'x', null, null, null],
  )),
  despesaRows('Meli Giselle', 'Outros', 10, monthRow(
    [63.5, 63.5, 63.5, 63.5, 63.5, 63.5, 63.5, 63.5, 63.5, 63.5, 63.5, 63.5],
    ['ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'x', 'x', 'x', 'x', 'x'],
  )),
  despesaRows('Nubank Tiago', 'Outros', 10, monthRow(
    [401.73, 377.3, 169.79, 119.05, 120, 146.8, 235.95, 110, 110, 110, 110, 110],
    ['ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'x', 'x', 'x', 'x', 'x'],
  )),
  despesaRows('Meli Tiago', 'Outros', 10, monthRow(
    [210.7, 210.7, 233.18, 324.17, 133.76, 133.76, 133.76, 133.76, 133.76, 133.76, 133.76, 133.76],
    ['ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'x', 'x', 'x', 'x', 'x'],
  )),
  despesaRows('Riachuelo', 'Outros', 3, monthRow(
    [95.39, 95.39, null, null, null, null, null, null, null, null, null, null],
    ['ok', 'ok', null, null, null, null, null, null, null, null, null, null],
  )),
  despesaRows('Cartão Itaú', 'Outros', 27, monthRow(
    [3654.14, 3495, 4196.34, 3354.69, 4330.07, 3938.83, 3655.53, 2500, 2000, 2000, 1500, 1500],
    ['ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'x', 'x', 'x', 'x', 'x'],
  )),
  despesaRows('Outros/Lazer', 'Lazer', 15, monthRow(
    [null, null, 3115.61, 101.38, null, 1000, null, null, null, null, null, null],
    [null, null, 'ok', 'ok', null, 'ok', null, null, null, null, null, null],
  )),
  despesaRows('Manutenção carro', 'Transporte', 15, monthRow(
    [null, 175, null, 1183.07, null, null, null, null, null, null, null, null],
    [null, 'ok', null, 'ok', null, null, null, null, null, null, null, null],
  )),
  despesaRows('Empréstimo', 'Outros', 15, monthRow(
    [605, 605, null, null, null, null, null, null, null, null, null, null],
    ['ok', 'ok', null, null, null, null, null, null, null, null, null, null],
  )),
].flat();

transactions.push(...despesas);

transactions.push(
  ...receitaRows('Salário Tiago', 'Salário', [
    2393, 2300, 4885.17, 5057, 4978.54, 5197.75, 5115, 5000, 5000, 5000, 5000, 5000,
  ]),
  ...receitaRows('Salário Giselle', 'Salário', [
    4800, 4800, 6579.34, 7022.29, 4429.77, 4997.53, 4982.73, 4898.09, 4898.09, 4898.09, 4898.09, 4898.09,
  ]),
  ...receitaRows('Renda Extra', 'Renda Extra', [
    2005, 0, 11490.19, 35011.06, 0, 3181.35, 4000, 0, 0, 20000, 0, 4000,
  ]),
  ...receitaRows('Férias', 'Férias', [0, 0, 0, 6584.33, 0, 0, 0, 0, 0, 0, 0, 0]),
  ...receitaRows('PLR', 'Bônus', [0, 0, 11490.19, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
  ...receitaRows('Décimo Terceiro', 'Décimo Terceiro', [2005, 0, 0, 28426.73, 0, 3181.35, 0, 0, 0, 0, 0, 4000]),
);

transactions.push(
  ...despesaRows('Aporte investimentos Tiago', 'Investimento', 28, monthRow(
    [null, null, 2000, 14725, 2250, null, null, null, null, null, null, null],
    [null, null, 'ok', 'ok', 'ok', null, null, null, null, null, null, null],
  )),
  ...despesaRows('Aporte investimentos Giselle', 'Investimento', 28, monthRow(
    [null, null, 10350, 758, 250, null, null, null, null, null, null, null],
    [null, null, 'ok', 'ok', 'ok', null, null, null, null, null, null, null],
  )),
);

transactions.sort((a, b) => a.data.localeCompare(b.data) || a.descricao.localeCompare(b.descricao));

const db = {
  transactions: transactions.map((t) => ({ id: id++, ...t })),
  investimentos: [],
  ativos: [],
  usuarios: [],
  convites: [],
};

const outPath = join(process.cwd(), 'db.json');
writeFileSync(outPath, `${JSON.stringify(db, null, 2)}\n`, 'utf8');

console.log(`✓ db.json — ${db.transactions.length} transações`);
console.log('  Próximo passo: npm run seed:sql -- --email=SEU_EMAIL --uuid=SEU_UUID');
