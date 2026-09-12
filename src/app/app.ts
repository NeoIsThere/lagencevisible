import { isPlatformBrowser } from '@angular/common';
import { Component, effect, inject, PLATFORM_ID, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { FooterComponent } from './shared/footer/footer.component';
import { HeaderComponent } from './shared/header/header.component';
import { SeoService } from './core/seo.service';
import { LanguageService } from './core/language.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly router = inject(Router);
  private readonly seo = inject(SeoService);
  readonly i18n = inject(LanguageService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  readonly operatorArea = signal(this.router.url === '/operator' || this.router.url.startsWith('/operator/'));

  constructor() {
    effect(() => {
      this.i18n.language();
      this.updateRouteSeo();
    });

    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => {
        this.operatorArea.set(this.router.url === '/operator' || this.router.url.startsWith('/operator/'));
        this.updateRouteSeo();
        if (this.isBrowser) window.scrollTo({ top: 0, behavior: 'auto' });
      });
  }

  private updateRouteSeo(): void {
    let route = this.router.routerState.snapshot.root;
    while (route.firstChild) route = route.firstChild;
    const data = route.data;
    if (data['title'] && data['description']) {
      this.seo.update({
        title: this.i18n.localize(data['title']),
        description: this.i18n.localize(data['description']),
        robots: data['robots'],
      });
    }
  }
}
