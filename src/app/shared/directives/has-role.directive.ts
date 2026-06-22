import {
  Directive,
  Input,
  TemplateRef,
  ViewContainerRef,
  effect,
  inject,
  signal,
} from '@angular/core';

import { AuthService } from '@app/core/services/auth.service';

/**
 * Diretiva estrutural de permissões por role.
 *
 * Exibe o template apenas se o usuário logado possuir **uma** das roles informadas.
 * Reage automaticamente quando `usuarioLogado` muda (ex.: após load do JSON Server).
 *
 * @example
 * ```html
 * <button *appHasRole="['admin']">Deletar Usuário</button>
 * <button *appHasRole="['admin', 'editor']">Novo Lançamento</button>
 * ```
 */
@Directive({
  selector: '[appHasRole]',
  standalone: true,
})
export class HasRoleDirective {
  private readonly auth = inject(AuthService);
  private readonly templateRef = inject(TemplateRef<unknown>);
  private readonly viewContainer = inject(ViewContainerRef);

  private readonly allowedRoles = signal<string[]>([]);

  @Input()
  set appHasRole(roles: string | string[]) {
    this.allowedRoles.set(Array.isArray(roles) ? roles : [roles]);
  }

  constructor() {
    effect(() => {
      const roles = this.allowedRoles();
      this.auth.usuarioLogado();

      const canShow = roles.length > 0 && this.auth.hasAnyRole(roles);

      this.viewContainer.clear();

      if (canShow) {
        this.viewContainer.createEmbeddedView(this.templateRef);
      }
    });
  }
}
