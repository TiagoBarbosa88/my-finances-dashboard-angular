import { Component, inject, OnInit } from '@angular/core';
import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import {
  provideRouter,
  Router,
  withComponentInputBinding,
  withNavigationErrorHandler,
} from '@angular/router';

import { routes } from './app.routes';
import { handleNavigationError } from '@app/core/utils/navigation-error.util';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideHttpClient(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withNavigationErrorHandler((error) => {
        handleNavigationError(error, inject(Router));
      }),
    ),
  ],
};
