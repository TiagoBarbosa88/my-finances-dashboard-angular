import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { APP_NAME } from '@app/core/constants/app-brand';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = APP_NAME;
}
