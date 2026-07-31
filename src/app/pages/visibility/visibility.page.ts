import { Component, effect, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../core/seo.service';
import { SITE_CONFIG } from '../../core/site.config';
import { FinalCtaComponent } from '../../shared/final-cta/final-cta.component';
import { LanguageService } from '../../core/language.service';

@Component({ selector: 'app-visibility-page', imports: [RouterLink, FinalCtaComponent], templateUrl: './visibility.page.html' })
export class VisibilityPage {
  private readonly seo = inject(SeoService);
  readonly i18n = inject(LanguageService);
  constructor() {
    effect(() => {
      const baseUrl = SITE_CONFIG.siteUrl.replace(/\/+$/, '');
      this.seo.setJsonLd('visibility-service-jsonld', {
        '@context': 'https://schema.org',
        '@type': 'Service',
        inLanguage: this.i18n.language(),
        name: this.i18n.t('Analyse et amélioration de site web', 'Website analysis and improvement'),
        description: this.i18n.t('Analyse du contenu, de la structure, de l’affichage mobile et des points à améliorer sur un site web.', 'Analysis of website content, structure, mobile display and areas for improvement.'),
        url: `${baseUrl}/visibilite-google-ia/`,
        provider: { '@type': 'Organization', '@id': `${baseUrl}/#organization`, name: SITE_CONFIG.brand },
        areaServed: 'France',
      });
    });
  }
}
