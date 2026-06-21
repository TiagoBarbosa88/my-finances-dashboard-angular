/** Equivalente a `src/hooks/use-mobile.tsx` (React). */
import { Directive, ElementRef, inject, OnDestroy, OnInit } from '@angular/core';

const MOBILE_BREAKPOINT = 768;

@Directive({
  selector: '[appMobile]',
  standalone: true,
  exportAs: 'appMobile',
})
export class MobileDirective implements OnInit, OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
  isMobile = this.mediaQuery.matches;

  private readonly listener = () => {
    this.isMobile = this.mediaQuery.matches;
    this.elementRef.nativeElement.dataset.mobile = String(this.isMobile);
  };

  ngOnInit(): void {
    this.listener();
    this.mediaQuery.addEventListener('change', this.listener);
  }

  ngOnDestroy(): void {
    this.mediaQuery.removeEventListener('change', this.listener);
  }
}
