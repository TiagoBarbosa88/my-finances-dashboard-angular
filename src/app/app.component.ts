import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { APP_NAME } from '@core/config/app-brand';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  title = APP_NAME;

  ngOnInit(): void {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('smart-finances:chunk-reload');
    }
  }
}
