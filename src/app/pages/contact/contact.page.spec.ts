import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ContactPage } from './contact.page';

describe('Contact page', () => {
  it('offers a direct email link without a form or sending service', async () => {
    await TestBed.configureTestingModule({ imports: [ContactPage], providers: [provideRouter([])] }).compileComponents();
    const fixture = TestBed.createComponent(ContactPage); fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('form')).toBeNull();
    expect(root.querySelector('a.button')?.getAttribute('href')).toBe('mailto:contact@mail.lagencevisible.com');
  });
});
