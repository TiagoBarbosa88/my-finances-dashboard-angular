import { Component, input, output } from '@angular/core';

import { Transaction } from '@app/shared/models/transaction.model';

/**
 * Modal de confirmação antes de excluir um lançamento.
 */
@Component({
  selector: 'app-delete-confirmation-dialog',
  standalone: true,
  templateUrl: './delete-confirmation-dialog.component.html',
})
export class DeleteConfirmationDialogComponent {
  transaction = input.required<Transaction>();

  /** Usuário confirmou a exclusão. */
  confirm = output<void>();

  /** Usuário cancelou ou fechou o modal. */
  cancel = output<void>();
}
