import * as XLSX from 'xlsx';

import {
  InvestimentoDraft,
  OperacaoInvestimento,
  TipoAtivo,
} from '@app/shared/models/investimentos.model';

export interface ImportInvestimentosResult {
  drafts: InvestimentoDraft[];
  errors: string[];
}

const TIPOS_VALIDOS: TipoAtivo[] = ['Ações', 'FIIs', 'ETFs', 'Tesouro Direto'];

/** Lê workbook via FileReader (ArrayBuffer) e converte linhas em InvestimentoDraft. */
export function parseInvestimentosFile(buffer: ArrayBuffer): ImportInvestimentosResult {
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    return { drafts: [], errors: ['Arquivo vazio ou sem planilhas.'] };
  }

  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
    workbook.Sheets[sheetName],
    { defval: '' },
  );

  if (rows.length === 0) {
    return { drafts: [], errors: ['Nenhuma linha de dados encontrada.'] };
  }

  const drafts: InvestimentoDraft[] = [];
  const errors: string[] = [];

  rows.forEach((row, index) => {
    const line = index + 2;
    const normalized = normalizeRowKeys(row);

    const ticker = pickString(normalized, ['ticker', 'ativo', 'codigo', 'symbol']);
    const quantidade = pickNumber(normalized, ['quantidade', 'qtd', 'quantity']);

    if (!ticker) {
      errors.push(`Linha ${line}: coluna "ticker" (ou "ativo") ausente ou vazia.`);
      return;
    }

    if (quantidade === null || quantidade <= 0) {
      errors.push(`Linha ${line}: coluna "quantidade" (ou "qtd") ausente ou inválida.`);
      return;
    }

    const preco = pickNumber(normalized, [
      'preco',
      'precomedio',
      'precoatual',
      'price',
      'valor',
    ]) ?? 0;

    drafts.push({
      operacao:     pickOperacao(normalized),
      tipo:         pickTipo(normalized),
      ticker:       ticker.toUpperCase(),
      setor:        pickString(normalized, ['setor', 'sector']) ?? '',
      data:         pickDate(normalized) ?? todayIso(),
      quantidade,
      preco,
      outrosCustos: pickNumber(normalized, ['outroscustos', 'custos', 'taxa']) ?? 0,
      criado_por:   pickString(normalized, ['criado_por', 'criadopor', 'usuario']) ?? 'Importação Excel',
    });
  });

  return { drafts, errors };
}

function normalizeRowKeys(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(row)) {
    out[normalizeKey(key)] = value;
  }

  return out;
}

function normalizeKey(key: string): string {
  return key
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '');
}

function pickString(row: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const raw = row[key];
    if (raw === null || raw === undefined || raw === '') continue;

    const text = String(raw).trim();
    if (text) return text;
  }

  return null;
}

function pickNumber(row: Record<string, unknown>, keys: string[]): number | null {
  for (const key of keys) {
    const raw = row[key];
    if (raw === null || raw === undefined || raw === '') continue;

    if (typeof raw === 'number' && Number.isFinite(raw)) return raw;

    const parsed = Number(
      String(raw).replace(/\./g, '').replace(',', '.').replace(/[^\d.-]/g, ''),
    );

    if (Number.isFinite(parsed)) return parsed;
  }

  return null;
}

function pickOperacao(row: Record<string, unknown>): OperacaoInvestimento {
  const raw = pickString(row, ['operacao', 'operacaoinvestimento', 'tipooperacao']);
  if (!raw) return 'compra';

  const value = raw.toLowerCase();
  if (value.startsWith('v') || value === 'sell') return 'venda';

  return 'compra';
}

function pickTipo(row: Record<string, unknown>): TipoAtivo {
  const raw = pickString(row, ['tipo', 'tipoativo', 'classe', 'categoria']);
  if (!raw) return 'Ações';

  const match = TIPOS_VALIDOS.find(
    (t) => normalizeKey(t) === normalizeKey(raw),
  );

  return match ?? 'Ações';
}

function pickDate(row: Record<string, unknown>): string | null {
  const raw = row['data'] ?? row['date'] ?? row['datatransacao'];

  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    return raw.toISOString().split('T')[0];
  }

  const text = raw != null ? String(raw).trim() : '';
  if (!text) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;

  const br = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (br) {
    const [, d, m, y] = br;
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }

  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return null;
}

function todayIso(): string {
  return new Date().toISOString().split('T')[0];
}
