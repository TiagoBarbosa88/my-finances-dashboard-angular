import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ErrorReportingService } from '@core/api/error-reporting.service';

/** Equivalente ao `ErrorComponent` em `src/routes/__root.tsx`. */
@Component({
  selector: 'app-error-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './error-page.component.html',
  styleUrl: './error-page.component.css',
})
export class ErrorPageComponent {
  private readonly errorReporting = inject(ErrorReportingService);

  constructor() {
    this.errorReporting.report(new Error('Unhandled route error'), {
      boundary: 'angular_error_page',
    });
  }

  reload(): void {
    window.location.reload();
  }
}
