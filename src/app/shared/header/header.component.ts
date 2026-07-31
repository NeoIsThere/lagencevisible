import { Component, HostListener, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter } from 'rxjs';
import { SITE_CONFIG } from '../../core/site.config';
import { LanguageService } from '../../core/language.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './header.component.html',
})
export class HeaderComponent {
  readonly site = SITE_CONFIG;
  readonly menuOpen = signal(false);
  readonly scrolled = signal(false);
  readonly i18n = inject(LanguageService);
  private readonly router = inject(Router);

  constructor() {
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => this.menuOpen.set(false));
  }

  @HostListener('window:scroll') onScroll(): void { this.scrolled.set(window.scrollY > 12); }
  toggleMenu(): void { this.menuOpen.update((open) => !open); }
}
