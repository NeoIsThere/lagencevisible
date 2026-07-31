import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { NavigationStart, Router } from '@angular/router';
import { filter } from 'rxjs';
import { SITE_CONFIG } from './site.config';
import { LanguageService } from './language.service';

interface SeoData {
  title: string;
  description: string;
  image?: string;
  type?: 'website' | 'article';
  path?: string;
  robots?: string;
  publishedTime?: string;
}

@Injectable({ providedIn: 'root' })
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);
  private readonly i18n = inject(LanguageService);
  private readonly router = inject(Router);

  constructor() {
    this.router.events
      .pipe(filter((event): event is NavigationStart => event instanceof NavigationStart))
      .subscribe(() => this.clearPageJsonLd());
  }

  update(data: SeoData): void {
    const baseUrl = SITE_CONFIG.siteUrl.replace(/\/+$/, '');
    const path = data.path ?? this.router.url.split(/[?#]/, 1)[0] ?? '/';
    const routePath = this.normalisePath(path);
    const canonical = `${baseUrl}${routePath}`;
    const image =
      data.image ??
      `${baseUrl}/${this.i18n.language() === 'en' ? 'og-cover-en.svg' : 'og-cover.svg'}`;
    const imageAlt =
      this.i18n.language() === 'en'
        ? `${SITE_CONFIG.brand} — website creation and improvement`
        : `${SITE_CONFIG.brand} — création et amélioration de sites web`;

    this.title.setTitle(data.title);
    this.meta.updateTag({ name: 'description', content: data.description });
    this.meta.updateTag({
      name: 'robots',
      content: data.robots ?? 'index, follow, max-image-preview:large',
    });
    this.meta.updateTag({ property: 'og:title', content: data.title });
    this.meta.updateTag({ property: 'og:description', content: data.description });
    this.meta.updateTag({ property: 'og:type', content: data.type ?? 'website' });
    this.meta.updateTag({ property: 'og:url', content: canonical });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ property: 'og:image:alt', content: imageAlt });
    this.meta.updateTag({ property: 'og:site_name', content: SITE_CONFIG.brand });
    this.meta.updateTag({ property: 'og:locale', content: this.i18n.language() === 'en' ? 'en_GB' : 'fr_FR' });
    if (data.publishedTime) {
      this.meta.updateTag({
        property: 'article:published_time',
        content: data.publishedTime,
      });
    } else {
      this.meta.removeTag('property="article:published_time"');
    }
    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: data.title });
    this.meta.updateTag({ name: 'twitter:description', content: data.description });
    this.meta.updateTag({ name: 'twitter:image', content: image });
    this.meta.updateTag({ name: 'twitter:image:alt', content: imageAlt });

    let link = this.document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = this.document.createElement('link');
      link.rel = 'canonical';
      this.document.head.appendChild(link);
    }
    link.href = canonical;

    this.setAlternate('fr', `${baseUrl}${routePath}`);
    this.setAlternate('x-default', `${baseUrl}${routePath}`);
    this.removeAlternate('en');
  }

  setJsonLd(id: string, value: object): void {
    this.document.getElementById(id)?.remove();
    const script = this.document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    script.setAttribute('data-page-jsonld', '');
    script.text = JSON.stringify(value);
    this.document.head.appendChild(script);
  }

  private setAlternate(language: string, href: string): void {
    let link = this.document.querySelector<HTMLLinkElement>(`link[rel="alternate"][hreflang="${language}"]`);
    if (!link) {
      link = this.document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = language;
      this.document.head.appendChild(link);
    }
    link.href = href;
  }

  private removeAlternate(language: string): void {
    this.document
      .querySelector<HTMLLinkElement>(`link[rel="alternate"][hreflang="${language}"]`)
      ?.remove();
  }

  private normalisePath(path: string): string {
    const cleanPath = `/${path}`.replace(/\/+/g, '/').replace(/\/$/, '');
    return cleanPath === '' ? '/' : `${cleanPath}/`;
  }

  private clearPageJsonLd(): void {
    this.document
      .querySelectorAll<HTMLScriptElement>('script[data-page-jsonld]')
      .forEach((script) => script.remove());
  }
}
