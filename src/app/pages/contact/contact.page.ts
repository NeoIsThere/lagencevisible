import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../../core/language.service';
import { SITE_CONFIG } from '../../core/site.config';

@Component({ selector: 'app-contact-page', imports: [RouterLink], templateUrl: './contact.page.html' })
export class ContactPage {
  readonly i18n = inject(LanguageService);
  readonly site = SITE_CONFIG;
}
