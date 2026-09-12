import { Component, effect, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../core/seo.service';
import { SITE_CONFIG } from '../../core/site.config';
import { FinalCtaComponent } from '../../shared/final-cta/final-cta.component';
import { LanguageService } from '../../core/language.service';

@Component({ selector: 'app-services-page', imports: [RouterLink, FinalCtaComponent], templateUrl: './services.page.html' })
export class ServicesPage {
  private readonly seo = inject(SeoService);
  readonly i18n = inject(LanguageService);
  constructor() {
    effect(() => {
      const baseUrl = SITE_CONFIG.siteUrl.replace(/\/+$/, '');
      this.seo.setJsonLd('services-jsonld', {
        '@context': 'https://schema.org',
        '@type': 'Service',
        inLanguage: this.i18n.language(),
        name: this.i18n.t('Création, amélioration et analyse de sites web', 'Website creation, improvement and analysis'),
        url: `${baseUrl}/services/`,
        provider: { '@type': 'ProfessionalService', '@id': `${baseUrl}/#organization`, name: SITE_CONFIG.brand },
        serviceType: this.i18n.t(
          ['Création de site web', 'Amélioration et modification de site web', 'Analyse de site web'],
          ['Website creation', 'Website improvement and modification', 'Website analysis'],
        ),
      });
    });
  }
}
