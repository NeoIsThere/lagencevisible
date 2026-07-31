import { Component, effect, inject } from '@angular/core';
import { LanguageService } from '../../core/language.service';
import { SeoService } from '../../core/seo.service';
import { SITE_CONFIG } from '../../core/site.config';
import { FinalCtaComponent } from '../../shared/final-cta/final-cta.component';

@Component({ selector: 'app-about-page', imports: [FinalCtaComponent], templateUrl: './about.page.html' })
export class AboutPage {
  readonly i18n = inject(LanguageService);
  private readonly seo = inject(SeoService);

  constructor() {
    effect(() => {
      const language = this.i18n.language();
      const baseUrl = SITE_CONFIG.siteUrl.replace(/\/+$/, '');
      const description = this.i18n.t(
        'L’agence visible réunit des ingénieurs expérimentés qui créent et améliorent des sites web clairs, fiables et attractifs.',
        'L’agence visible is led by experienced engineers who create and improve clear, reliable and engaging websites.',
      );

      this.seo.setJsonLd('about-jsonld', {
        '@context': 'https://schema.org',
        '@type': 'AboutPage',
        inLanguage: language,
        name: this.i18n.t('Notre expertise — L’agence visible', 'Our expertise — L’agence visible'),
        description,
        url: `${baseUrl}/a-propos/`,
        mainEntity: {
          '@type': 'Organization',
          name: SITE_CONFIG.brand,
          url: `${baseUrl}/`,
          description,
          areaServed: { '@type': 'Country', name: this.i18n.t('France', 'France') },
          knowsAbout: [
            this.i18n.t('Création de sites web', 'Website creation'),
            this.i18n.t('Analyse de sites web', 'Website analysis'),
            this.i18n.t('Amélioration et modification de sites web', 'Website improvement and modification'),
          ],
        },
      });
    });
  }
}
