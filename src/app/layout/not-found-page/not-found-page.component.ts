import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { APP_HOME } from '@app/core/constants/app-routes';

/** Equivalente ao `NotFoundComponent` em `src/routes/__root.tsx`. */
@Component({
  selector: 'app-not-found-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './not-found-page.component.html',
  styleUrl: './not-found-page.component.css',
})
export class NotFoundPageComponent {
  readonly appHome = APP_HOME;
}
