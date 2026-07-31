import { Component, inject, input } from '@angular/core';
import { LanguageService } from '../../core/language.service';

@Component({
  selector: 'app-site-mockup',
  templateUrl: './site-mockup.component.html',
})
export class SiteMockupComponent {
  readonly variant = input<'coral' | 'blue' | 'green'>('coral');
  readonly label = input('Votre entreprise');
  readonly i18n = inject(LanguageService);
}
