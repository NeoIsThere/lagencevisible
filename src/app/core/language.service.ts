import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { afterNextRender, effect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

export type Language = 'fr' | 'en';

export interface LocalizedText {
  fr: string;
  en: string;
}

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly document = inject(DOCUMENT);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly activeLanguage = signal<Language>('fr');

  readonly language = this.activeLanguage.asReadonly();

  constructor() {
    effect(() => {
      this.document.documentElement.lang = this.activeLanguage();
    });

    afterNextRender(() => {
      const url = new URL(window.location.href);
      const requested = url.searchParams.get('lang');
      const saved = window.localStorage.getItem('site-language');
      const language: Language = requested === 'en' || (requested !== 'fr' && saved === 'en') ? 'en' : 'fr';
      this.setLanguage(language, false);
    });
  }

  t<T>(french: T, english: T): T {
    return this.activeLanguage() === 'fr' ? french : english;
  }

  localize(value: string | LocalizedText): string {
    return typeof value === 'string' ? value : value[this.activeLanguage()];
  }

  toggle(): void {
    this.setLanguage(this.activeLanguage() === 'fr' ? 'en' : 'fr');
  }

  setLanguage(language: Language, updateUrl = true): void {
    this.activeLanguage.set(language);
    if (!this.isBrowser) return;

    window.localStorage.setItem('site-language', language);
    if (!updateUrl) return;

    const url = new URL(window.location.href);
    if (language === 'en') url.searchParams.set('lang', 'en');
    else url.searchParams.delete('lang');
    window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
  }
}
