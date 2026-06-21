import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { CATEGORIAS, TipoTransacao } from '@app/core/services/finance.data';
import { FinanceService } from '@app/core/services/finance.service';
import { Transaction } from '@app/shared/models/transaction.model';

type RecorrenciaOpcao = '1x' | 'Recorrente';

/**
 * Modal "Novo Lançamento" / "Editar Lançamento" com validação reativa.
 *
 * Modo criação: `transaction` é `null`.
 * Modo edição:  `transaction` recebe o lançamento selecionado via `@Input`.
 */
@Component({
  selector: 'app-new-transaction-dialog',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './new-transaction-dialog.component.html',
})
export class NewTransactionDialogComponent {
  /** Emitido quando o modal deve ser fechado (×, Cancelar, clique fora ou após salvar). */
  close = output<void>();

  /** Quando informado, o modal entra em modo edição. */
  transaction = input<Transaction | null>(null);

  private readonly finance = inject(FinanceService);

  /** Opções do toggle — evita `as const` no template. */
  readonly tipoOptions: TipoTransacao[] = ['DESPESA', 'RECEITA'];

  readonly recorrenciaOptions: RecorrenciaOpcao[] = ['1x', 'Recorrente'];

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

  readonly isEditMode = computed(() => this.transaction() !== null);

  /** Lista de categorias conforme o tipo selecionado (receita ou despesa). */
  readonly categoriasFiltradas = computed(() =>
    this.tipoTransacao() === 'RECEITA' ? CATEGORIAS.RECEITA : CATEGORIAS.DESPESA,
  );

  readonly isFormValid = computed(() => {
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

  salvar(): void {
    if (!this.isFormValid()) return;

    const payload = {
      data:       this.dataLancamento(),
      descricao:  this.descricao().trim(),
      categoria:  this.categoria(),
      valor:      this.valor()!,
      status:     this.status(),
      criado_por: this.transaction()?.criado_por ?? 'Você',
    };

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

  private loadTransaction(t: Transaction): void {
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
  }
}
