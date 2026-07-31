import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../../core/language.service';
import { SITE_CONFIG } from '../../core/site.config';

@Component({ selector: 'app-legal-page', imports: [RouterLink], templateUrl: './legal.page.html' })
export class LegalPage {
  readonly i18n = inject(LanguageService);
  readonly site = SITE_CONFIG;
}
