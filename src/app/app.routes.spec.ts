import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { routes } from './app.routes';
import { NotFoundPage } from './pages/not-found/not-found.page';
import { ContactPage } from './pages/contact/contact.page';

describe('Public routes after operator retirement', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    await TestBed.configureTestingModule({
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
  });
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it.each(['/login', '/operator', '/operator/campaigns', '/operator/locations', '/operator/configuration'])(
    'renders the public not-found page for %s without requesting a session', async path => {
      const harness = await RouterTestingHarness.create();
      await harness.navigateByUrl(path, NotFoundPage);
      expect(harness.routeNativeElement?.textContent).toContain('Cette page reste introuvable.');
      expect(harness.routeNativeElement?.querySelector('a')?.getAttribute('href')).toBe('/');
      TestBed.inject(HttpTestingController).expectNone(request => request.url.startsWith('/api/'));
    },
  );

  it('keeps the public contact route and direct email link available', async () => {
    const harness = await RouterTestingHarness.create();
    await harness.navigateByUrl('/contact', ContactPage);
    expect(harness.routeNativeElement?.querySelector('a.button')?.getAttribute('href')).toBe('mailto:contact@mail.lagencevisible.com');
    TestBed.inject(HttpTestingController).expectNone(request => request.url.startsWith('/api/'));
  });
});
