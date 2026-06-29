import { DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';

import { CATEGORIAS, TipoTransacao } from '@features/dashboard/data/finance.data';
import { FinanceService } from '@core/api/finance.service';
import { Transaction, TransactionStatus } from '@shared/models/transaction.model';

type RecorrenciaOpcao = '1x' | 'Recorrente';
type TransactionDraft = Omit<Transaction, 'id'>;

/** Linhas brutas do Excel antes do mapeamento. */
interface ExcelRow {
  [key: string]: unknown;
}

/**
 * Modal "Novo Lançamento" / "Editar Lançamento" com validação reativa.
 *
 * Modo criação: `transaction` é `null`.
 * Modo edição:  `transaction` recebe o lançamento selecionado via `@Input`.
 */
@Component({
  selector: 'app-new-transaction-dialog',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  templateUrl: './new-transaction-dialog.component.html',
})
export class NewTransactionDialogComponent {
  /** Emitido quando o modal deve ser fechado (×, Cancelar, clique fora ou após salvar). */
  close = output<void>();

  /** Quando informado, o modal entra em modo edição. */
  transaction = input<Transaction | null>(null);

  private readonly finance = inject(FinanceService);

  readonly tipoOptions: TipoTransacao[] = ['DESPESA', 'RECEITA'];
  readonly recorrenciaOptions: RecorrenciaOpcao[] = ['1x', 'Recorrente'];

  readonly acceptedFileTypes =
    '.xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv';

  /* ── Campos do formulário (signals graváveis) ── */
  readonly tipoTransacao    = signal<TipoTransacao>('DESPESA');
  readonly descricao        = signal('');
  readonly valor            = signal<number | null>(null);
  readonly dataLancamento   = signal(new Date().toISOString().split('T')[0]);
  readonly recorrencia      = signal<RecorrenciaOpcao>('1x');
  readonly isRecorrente     = signal(false);
  readonly vezesRecorrencia = signal(2);
  readonly categoria        = signal('');
  readonly status           = signal<'pago' | 'pendente'>('pendente');
  readonly observacoes      = signal('');

  /** Lançamentos lidos do Excel aguardando confirmação (2+ linhas). */
  readonly lancamentosPendentes = signal<TransactionDraft[]>([]);
  readonly importando           = signal(false);
  readonly importError            = signal<string | null>(null);
  readonly isDragOver             = signal(false);

  readonly isEditMode = computed(() => this.transaction() !== null);
  readonly modoImportacao = computed(() => this.lancamentosPendentes().length > 0);

  readonly categoriasFiltradas = computed(() =>
    this.tipoTransacao() === 'RECEITA' ? CATEGORIAS.RECEITA : CATEGORIAS.DESPESA,
  );

  readonly isFormValid = computed(() => {
    if (this.modoImportacao()) {
      return this.lancamentosPendentes().length > 0;
    }

    const recorrenciaOk =
      this.isEditMode() ||
      !this.isRecorrente() ||
      (this.vezesRecorrencia() >= 2 && this.vezesRecorrencia() <= 12);

    return (
      this.descricao().trim().length > 0 &&
      (this.valor() ?? 0) > 0 &&
      this.categoria().length > 0 &&
      this.dataLancamento().length > 0 &&
      recorrenciaOk
    );
  });

  constructor() {
    effect(() => {
      const editing = this.transaction();
      if (editing) {
        this.loadTransaction(editing);
      } else {
        this.resetForm();
      }
    });
  }

  setTipoTransacao(tipo: TipoTransacao): void {
    this.tipoTransacao.set(tipo);

    const selecionada = this.categoria();
    if (selecionada && !this.categoriasFiltradas().some((cat) => cat === selecionada)) {
      this.categoria.set('');
    }
  }

  setRecorrencia(opcao: RecorrenciaOpcao): void {
    this.recorrencia.set(opcao);
    this.isRecorrente.set(opcao === 'Recorrente');

    if (opcao === '1x') {
      this.vezesRecorrencia.set(2);
    }
  }

  tipoLabel(tipo: TipoTransacao): string {
    return tipo === 'DESPESA' ? 'despesa' : 'receita';
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);

    const file = event.dataTransfer?.files?.[0];
    if (file) this.processFile(file);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.processFile(file);
    input.value = '';
  }

  removerPendente(index: number): void {
    this.lancamentosPendentes.update((list) => list.filter((_, i) => i !== index));
  }

  limparImportacao(): void {
    this.lancamentosPendentes.set([]);
    this.importError.set(null);
  }

  salvar(): void {
    if (!this.isFormValid()) return;

    if (this.modoImportacao()) {
      this.confirmarImportacao();
      return;
    }

    const payload = this.buildPayload();

    const editing = this.transaction();
    if (editing) {
      this.finance.updateTransaction(editing.id, payload);
    } else {
      this.finance.addTransaction(payload, {
        recorrente: this.isRecorrente(),
        vezes:      this.isRecorrente() ? this.vezesRecorrencia() : 1,
      });
    }

    this.resetForm();
    this.close.emit();
  }

  private confirmarImportacao(): void {
    for (const item of this.lancamentosPendentes()) {
      this.finance.addTransaction(item);
    }

    this.resetForm();
    this.close.emit();
  }

  private buildPayload(): TransactionDraft {
    return {
      data:       this.dataLancamento(),
      descricao:  this.descricao().trim(),
      categoria:  this.categoria(),
      valor:      this.valor()!,
      status:     this.status(),
      criado_por: this.transaction()?.criado_por ?? 'Você',
    };
  }

  private processFile(file: File): void {
    this.importError.set(null);
    this.importando.set(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result;
        if (!(buffer instanceof ArrayBuffer)) {
          throw new Error('Não foi possível ler o arquivo.');
        }

        const rows = this.readExcelRows(buffer);
        const mapped = rows
          .map((row) => this.mapExcelRowToTransaction(row))
          .filter((item): item is TransactionDraft => item !== null);

        if (mapped.length === 0) {
          throw new Error('Nenhuma linha válida encontrada. Verifique as colunas Data, Descrição e Valor.');
        }

        if (mapped.length === 1) {
          this.lancamentosPendentes.set([]);
          this.preencherFormulario(mapped[0]);
        } else {
          this.lancamentosPendentes.set(mapped);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erro ao processar o arquivo.';
        this.importError.set(message);
      } finally {
        this.importando.set(false);
      }
    };

    reader.onerror = () => {
      this.importError.set('Falha ao ler o arquivo.');
      this.importando.set(false);
    };

    reader.readAsArrayBuffer(file);
  }

  private readExcelRows(buffer: ArrayBuffer): ExcelRow[] {
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
    const sheetName = workbook.SheetNames[0];

    if (!sheetName) return [];

    const sheet = workbook.Sheets[sheetName];
    return XLSX.utils.sheet_to_json<ExcelRow>(sheet, { defval: '' });
  }

  /**
   * Mapeia uma linha do Excel para o formato Transaction.
   * Colunas aceitas (case-insensitive, com ou sem acento):
   *   Data, Descrição, Valor, Categoria, Status
   */
  private mapExcelRowToTransaction(row: ExcelRow): TransactionDraft | null {
    const dataRaw       = this.findColumn(row, ['data', 'date', 'dt']);
    const descricaoRaw  = this.findColumn(row, ['descricao', 'descrição', 'description', 'desc']);
    const valorRaw      = this.findColumn(row, ['valor', 'value', 'amount', 'vlr']);
    const categoriaRaw  = this.findColumn(row, ['categoria', 'category', 'cat']);
    const statusRaw     = this.findColumn(row, ['status', 'situacao', 'situação']);

    const data = this.parseDate(dataRaw);
    const descricao = String(descricaoRaw ?? '').trim();
    const valor = this.parseValor(valorRaw);

    if (!data || !descricao || valor === null || valor <= 0) {
      return null;
    }

    const categoria = this.resolveCategoria(String(categoriaRaw ?? '').trim());
    const status = this.parseStatus(statusRaw);

    return {
      data,
      descricao,
      categoria,
      valor,
      status,
      criado_por: 'Importação Excel',
    };
  }

  private findColumn(row: ExcelRow, aliases: string[]): unknown {
    const normalizedAliases = aliases.map((alias) => this.normalizeKey(alias));

    for (const [key, value] of Object.entries(row)) {
      if (normalizedAliases.includes(this.normalizeKey(key))) {
        return value;
      }
    }

    return undefined;
  }

  private normalizeKey(key: string): string {
    return key
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }

  private parseDate(value: unknown): string | null {
    if (value instanceof Date && !isNaN(value.getTime())) {
      return this.toISODate(value);
    }

    if (typeof value === 'number' && XLSX.SSF?.parse_date_code) {
      const parsed = XLSX.SSF.parse_date_code(value);
      if (parsed) {
        return this.toISODate(new Date(parsed.y, parsed.m - 1, parsed.d));
      }
    }

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return null;

      const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;

      const brMatch = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
      if (brMatch) {
        const day = brMatch[1].padStart(2, '0');
        const month = brMatch[2].padStart(2, '0');
        const year = brMatch[3].length === 2 ? `20${brMatch[3]}` : brMatch[3];
        return `${year}-${month}-${day}`;
      }

      const asDate = new Date(trimmed);
      if (!isNaN(asDate.getTime())) {
        return this.toISODate(asDate);
      }
    }

    return null;
  }

  private parseValor(value: unknown): number | null {
    if (typeof value === 'number' && !isNaN(value)) {
      return Math.abs(value);
    }

    if (typeof value === 'string') {
      const cleaned = value
        .replace(/[R$\s]/g, '')
        .replace(/\./g, '')
        .replace(',', '.');
      const parsed = parseFloat(cleaned);
      return isNaN(parsed) ? null : Math.abs(parsed);
    }

    return null;
  }

  private parseStatus(value: unknown): TransactionStatus {
    const text = String(value ?? '').toLowerCase().trim();
    if (text.includes('pago') || text.includes('paid')) return 'pago';
    return 'pendente';
  }

  private resolveCategoria(value: string): string {
    if (!value) return 'Outros';

    const all = [...CATEGORIAS.DESPESA, ...CATEGORIAS.RECEITA];
    const match = all.find((cat) => this.normalizeKey(cat) === this.normalizeKey(value));
    return match ?? value;
  }

  private preencherFormulario(item: TransactionDraft): void {
    this.tipoTransacao.set(this.inferTipo(item.categoria));
    this.descricao.set(item.descricao);
    this.valor.set(item.valor);
    this.dataLancamento.set(item.data);
    this.categoria.set(
      this.categoriasFiltradas().some((cat) => cat === item.categoria)
        ? item.categoria
        : this.inferTipo(item.categoria) === 'RECEITA'
          ? 'Outros'
          : item.categoria || 'Outros',
    );
    this.status.set(item.status);
    this.observacoes.set('Importado da planilha');
  }

  private loadTransaction(t: Transaction): void {
    this.lancamentosPendentes.set([]);
    this.importError.set(null);
    this.tipoTransacao.set(this.inferTipo(t.categoria));
    this.descricao.set(t.descricao);
    this.valor.set(t.valor);
    this.dataLancamento.set(t.data);
    this.categoria.set(t.categoria);
    this.status.set(t.status);
    this.recorrencia.set('1x');
    this.isRecorrente.set(false);
    this.vezesRecorrencia.set(2);
    this.observacoes.set('');
  }

  private inferTipo(categoria: string): TipoTransacao {
    return CATEGORIAS.RECEITA.some((cat) => cat === categoria) ? 'RECEITA' : 'DESPESA';
  }

  private resetForm(): void {
    this.tipoTransacao.set('DESPESA');
    this.descricao.set('');
    this.valor.set(null);
    this.dataLancamento.set(new Date().toISOString().split('T')[0]);
    this.recorrencia.set('1x');
    this.isRecorrente.set(false);
    this.vezesRecorrencia.set(2);
    this.categoria.set('');
    this.status.set('pendente');
    this.observacoes.set('');
    this.lancamentosPendentes.set([]);
    this.importError.set(null);
    this.importando.set(false);
    this.isDragOver.set(false);
  }

  private toISODate(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
