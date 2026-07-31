import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../../core/language.service';

@Component({ selector: 'app-final-cta', imports: [RouterLink], templateUrl: './final-cta.component.html' })
export class FinalCtaComponent {
  readonly i18n = inject(LanguageService);
}
