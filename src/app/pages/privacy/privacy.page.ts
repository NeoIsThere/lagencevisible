import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../../core/language.service';
import { SITE_CONFIG } from '../../core/site.config';

@Component({ selector: 'app-privacy-page', imports: [RouterLink], templateUrl: './privacy.page.html' })
export class PrivacyPage {
  readonly i18n = inject(LanguageService);
  readonly site = SITE_CONFIG;
}
