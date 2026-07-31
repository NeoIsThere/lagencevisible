import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LanguageService } from '../../core/language.service';

@Component({
  selector: 'app-not-found-page',
  imports: [RouterLink],
  template: `<section class="not-found"><div><strong>404</strong><h1>{{ i18n.t('Cette page reste introuvable.', 'This page could not be found.') }}</h1><p>{{ i18n.t('Revenons à l’essentiel : faire exister votre entreprise en ligne.', 'Back to what matters: giving your business an online presence.') }}</p><a class="button" routerLink="/">{{ i18n.t('Retour à l’accueil', 'Back to the homepage') }}</a></div></section>`,
})
export class NotFoundPage {
  readonly i18n = inject(LanguageService);
}
