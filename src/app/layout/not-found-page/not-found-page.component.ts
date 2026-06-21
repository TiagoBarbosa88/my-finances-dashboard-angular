import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Equivalente ao `NotFoundComponent` em `src/routes/__root.tsx`. */
@Component({
  selector: 'app-not-found-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './not-found-page.component.html',
  styleUrl: './not-found-page.component.css',
})
export class NotFoundPageComponent {}
