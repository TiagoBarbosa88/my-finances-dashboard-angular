import { NgClass } from '@angular/common';
import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [NgClass],
  templateUrl: './confirm-dialog.component.html',
})
export class ConfirmDialogComponent {
  readonly title = input.required<string>();
  readonly message = input('');
  readonly confirmLabel = input('Confirmar');
  readonly cancelLabel = input('Cancelar');
  readonly destructive = input(true);

  readonly confirm = output<void>();
  readonly cancel = output<void>();
}
