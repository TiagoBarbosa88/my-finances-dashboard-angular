/**
 * Fonte única da planilha 2026 — despesas e receitas.
 * Usado por import-planilha-2026.mjs e validate-planilha-2026.mjs
 */

/** @typedef {{ descricao: string; categoria: string; day: number; values: (number|null)[]; marks: ('ok'|'x'|null)[] }} DespesaRow */
/** @typedef {{ descricao: string; categoria: string; values: (number|null)[] }} ReceitaRow */

const MONTHS = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

/** @type {DespesaRow[]} */
export const DESPESAS = [
  {
    descricao: 'Faculdade Giselle', categoria: 'Educação', day: 5,
    values: [197.75, 143.46, 143.46, 145, 145, 145, 197.75, 190, 190, 190, 190, 190],
    marks: ['ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'x', 'x', 'x', 'x', 'x'],
  },
  {
    descricao: 'Faculdade Tiago', categoria: 'Educação', day: 5,
    values: [208.74, 318.26, 318.26, 318.26, 318.26, 318.26, 107, null, null, null, null, null],
    marks: ['ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'ok', null, null, null, null, null],
  },
  {
    descricao: 'Garagem', categoria: 'Transporte', day: 5,
    values: [170, 170, 170, 200, 200, 200, 200, 200, 200, 200, 200, 200],
    marks: ['ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'x', 'x', 'x', 'x', 'x'],
  },
  {
    descricao: 'Seguro carro', categoria: 'Transporte', day: 5,
    values: [276.34, 442, 171.5, 205.5, 166.5, 271.5, 214.5, 241.58, 241.58, 241.58, 241.58, 241.58],
    marks: ['ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'x', 'x', 'x', 'x', 'x'],
  },
  {
    descricao: 'Água', categoria: 'Moradia', day: 1,
    values: [null, null, null, null, null, null, 138.93, null, null, null, null, null],
    marks: [null, null, null, null, null, null, 'ok', null, null, null, null, null],
  },
  {
    descricao: 'Luz', categoria: 'Moradia', day: 1,
    values: [null, null, null, null, null, null, 241.75, null, null, null, null, null],
    marks: [null, null, null, null, null, null, 'ok', null, null, null, null, null],
  },
  {
    descricao: 'Internet', categoria: 'Tecnologia', day: 10,
    values: [99.9, 99.9, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100],
    marks: ['ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'x', 'x', 'x', 'x', 'x'],
  },
  {
    descricao: 'Tio Luiz', categoria: 'Dependentes', day: 10,
    values: [0, 230, 250, 250, 250, 250, 250, 250, 250, 250, 250, 250],
    marks: ['ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'x', 'x', 'x', 'x', 'x'],
  },
  {
    descricao: 'William', categoria: 'Dependentes', day: 30,
    values: [350, 350, 350, 20350, null, null, null, null, null, null, null, null],
    marks: ['ok', 'ok', 'ok', 'ok', null, null, null, 'x', null, null, null, null],
  },
  {
    descricao: 'Vovô Marcos', categoria: 'Dependentes', day: 1,
    values: [0, 0, 100, 100, 100, 100, 100, 100, 100, 100, 100, 100],
    marks: ['ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'x', 'x', 'x', 'x', 'x'],
  },
  {
    descricao: 'Yago', categoria: 'Dependentes', day: 1,
    values: [50, 50, 105, 50, 50, 50, 94, 50, 50, 50, 50, 50],
    marks: ['ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'x', 'x', 'x', 'x', 'x'],
  },
  {
    descricao: 'Dentista', categoria: 'Dependentes', day: 1,
    values: [0, 0, 0, 0, 85, 0, null, null, null, null, null, null],
    marks: ['ok', 'ok', 'ok', 'ok', 'ok', 'x', null, null, null, null, null, null],
  },
  {
    descricao: 'Santander', categoria: 'Outros', day: 1,
    values: [250, 299.4, null, null, null, null, null, null, null, null, null, null],
    marks: ['ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'x', 'x', 'x', 'x', 'x', 'x'],
  },
  {
    descricao: 'Nubank Giselle', categoria: 'Outros', day: 1,
    values: [104, 70, 2533.85, 333.53, 325.54, 377.62, 412, 403.33, 290, null, null, null],
    marks: ['ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'x', 'x', null, null, null],
  },
  {
    descricao: 'Meli Giselle', categoria: 'Outros', day: 10,
    values: [0, 63.5, 63.5, 63.5, 63.5, 63.5, 63.5, 63.5, 63.5, 63.5, 63.5, 63.5],
    marks: ['ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'x', 'x', 'x', 'x', 'x'],
  },
  {
    descricao: 'Nubank Tiago', categoria: 'Outros', day: 10,
    values: [401.73, 377.3, 169.79, 119.05, 120, 146.8, 235.95, 110, 110, 110, 110, 110],
    marks: ['ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'x', 'x', 'x', 'x', 'x'],
  },
  {
    descricao: 'Meli Tiago', categoria: 'Outros', day: 10,
    values: [210.7, 210.7, 233.18, 324.17, 133.76, 133.76, 133.76, 133.76, 133.76, 133.76, 133.76, 133.76],
    marks: ['ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'x', 'x', 'x', 'x', 'x'],
  },
  {
    descricao: 'Riachuelo', categoria: 'Outros', day: 3,
    values: [95.39, 95.39, null, null, 0, null, null, null, null, null, null, null],
    marks: ['ok', 'ok', 'ok', 'ok', 'ok', 'x', null, null, null, null, null, null],
  },
  {
    descricao: 'Cartão Itaú', categoria: 'Outros', day: 27,
    values: [3654.14, 3495, 4196.34, 3354.69, 4330.07, 3938.83, 3655.53, 2500, 2000, 2000, 1500, 1500],
    marks: ['ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'ok', 'x', 'x', 'x', 'x', 'x'],
  },
  {
    descricao: 'Outros/Lazer', categoria: 'Lazer', day: 15,
    values: [null, null, 3115.61, 101.38, 0, 1000, null, null, null, null, null, null],
    marks: [null, null, 'ok', 'ok', 'x', 'ok', null, null, null, null, null, null],
  },
  {
    descricao: 'Manutenção carro', categoria: 'Transporte', day: 15,
    values: [null, 175, null, 1183.07, null, null, null, null, null, null, null, null],
    marks: [null, 'ok', null, 'ok', null, null, null, null, null, null, null, null],
  },
  {
    descricao: 'Empréstimo', categoria: 'Outros', day: 15,
    values: [605, 605, null, null, null, null, null, null, null, null, null, null],
    marks: ['ok', 'ok', 'ok', 'ok', 'ok', 'x', 'x', 'x', 'x', 'x', 'x', 'x'],
  },
];

/** @type {ReceitaRow[]} */
export const RECEITAS = [
  {
    descricao: 'Salário Tiago', categoria: 'Salário',
    values: [2393, 2300, 4885.17, 5057, 4978.54, 5197.75, 5115, 5000, 5000, 5000, 5000, 5000],
  },
  {
    descricao: 'Salário Giselle', categoria: 'Salário',
    values: [4800, 4800, 6579.34, 7022.29, 4429.77, 4997.53, 4982.73, 4898.09, 4898.09, 4898.09, 4898.09, 4898.09],
  },
  {
    descricao: 'Férias', categoria: 'Férias',
    values: [0, 0, 0, 6584.33, 0, 0, 4000, 0, 0, 0, 0, 0],
  },
  {
    descricao: 'PLR', categoria: 'Bônus',
    values: [0, 0, 11490.19, 0, 0, 0, 0, 0, 0, 20000, 0, 0],
  },
  {
    descricao: 'Décimo Terceiro', categoria: 'Décimo Terceiro',
    values: [2005, 0, 0, 28426.73, 0, 3181.35, 0, 0, 0, 0, 0, 4000],
  },
];

export { MONTHS };
