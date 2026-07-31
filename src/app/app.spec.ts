import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { LanguageService } from './core/language.service';

describe('App', () => {
  beforeEach(async () => {
    window.localStorage.clear();
    await TestBed.configureTestingModule({ imports: [App], providers: [provideRouter([]), provideHttpClient()] }).compileComponents();
  });

  it('creates the application shell', () => {
    expect(TestBed.createComponent(App).componentInstance).toBeTruthy();
  });

  it('renders the primary navigation and legal footer identity', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('L’agence visible');
    expect(text).toContain('Prendre contact');
    expect(text).toContain('Samuel LAVALLEE — Entrepreneur individuel');
    expect(text).toContain('Mentions légales');
    expect(text).toContain('Politique de confidentialité');
    expect(text).not.toContain('Réalisations');
  });

  it('switches the shared interface to English', () => {
    const fixture = TestBed.createComponent(App);
    const language = TestBed.inject(LanguageService);
    language.setLanguage('en');
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(document.documentElement.lang).toBe('en');
    expect(text).toContain('Get in touch');
    expect(text).toContain('Legal notice');
    expect(text).toContain('Privacy policy');
  });
});
