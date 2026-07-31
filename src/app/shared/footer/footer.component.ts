import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SITE_CONFIG } from '../../core/site.config';
import { LanguageService } from '../../core/language.service';

@Component({ selector: 'app-footer', imports: [RouterLink], templateUrl: './footer.component.html' })
export class FooterComponent {
  readonly site = SITE_CONFIG;
  readonly i18n = inject(LanguageService);
}
