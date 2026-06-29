import { Component, input, OnDestroy, OnInit, signal } from '@angular/core';

import { APP_NAME } from '@core/config/app-brand';

const DISMISS_KEY = 'smart-finances:pwa-install-dismissed';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

@Component({
  selector: 'app-pwa-install-banner',
  standalone: true,
  templateUrl: './pwa-install-banner.component.html',
})
export class PwaInstallBannerComponent implements OnInit, OnDestroy {
  readonly appName = APP_NAME;
  readonly visible = signal(false);
  /** Eleva o banner acima da bottom nav mobile (shell autenticado). */
  readonly aboveNav = input(false);

  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private readonly onBeforeInstallPrompt = (event: Event): void => {
    event.preventDefault();
    this.deferredPrompt = event as BeforeInstallPromptEvent;
    this.visible.set(true);
  };

  ngOnInit(): void {
    if (typeof window === 'undefined') return;
    if (this.isStandalone() || this.wasDismissed()) return;

    window.addEventListener('beforeinstallprompt', this.onBeforeInstallPrompt);
  }

  ngOnDestroy(): void {
    if (typeof window === 'undefined') return;
    window.removeEventListener('beforeinstallprompt', this.onBeforeInstallPrompt);
  }

  async install(): Promise<void> {
    if (!this.deferredPrompt) return;

    await this.deferredPrompt.prompt();
    const { outcome } = await this.deferredPrompt.userChoice;

    this.deferredPrompt = null;
    this.visible.set(false);

    if (outcome === 'dismissed') {
      this.dismiss();
    }
  }

  dismiss(): void {
    this.visible.set(false);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(DISMISS_KEY, '1');
    }
  }

  private isStandalone(): boolean {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    );
  }

  private wasDismissed(): boolean {
    return typeof localStorage !== 'undefined' && localStorage.getItem(DISMISS_KEY) === '1';
  }
}
