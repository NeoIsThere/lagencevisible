import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { LanguageService } from '../../core/language.service';
import { contactEndpoint, SITE_CONFIG } from '../../core/site.config';

@Component({ selector: 'app-contact-page', imports: [ReactiveFormsModule, RouterLink], templateUrl: './contact.page.html' })
export class ContactPage {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  readonly i18n = inject(LanguageService);
  readonly site = SITE_CONFIG;
  readonly submitting = signal(false);
  readonly status = signal<'idle' | 'success' | 'error'>('idle');
  private readonly messageKey = signal<'validation' | 'configuration' | 'success' | 'send' | 'rate-limit' | null>(null);
  readonly message = computed(() => {
    switch (this.messageKey()) {
      case 'validation':
        return this.i18n.t(
          'Vérifiez les champs indiqués avant d’envoyer votre demande.',
          'Check the highlighted fields before sending your enquiry.',
        );
      case 'configuration':
        return this.i18n.t(
          'Le formulaire doit encore être relié à son service d’envoi. Vous pouvez nous écrire directement par email.',
          'The form is not yet connected. You can email us directly instead.',
        );
      case 'success':
        return this.i18n.t(
          'Votre demande a bien été envoyée. Nous revenons vers vous personnellement.',
          'Your enquiry has been sent. We will reply directly.',
        );
      case 'rate-limit':
        return this.i18n.t(
          'Trop de tentatives ont été effectuées. Veuillez réessayer plus tard.',
          'Too many attempts have been made. Please try again later.',
        );
      case 'send':
        return this.i18n.t(
          'L’envoi n’a pas abouti. Réessayez dans un instant ou contactez-nous directement par email.',
          'The message could not be sent. Try again in a moment or email us directly.',
        );
      default:
        return '';
    }
  });
  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
    company: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(120)]],
    email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
    phone: ['', [Validators.maxLength(30)]],
    website: ['', [Validators.maxLength(200)]],
    message: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(3000)]],
  });

  hasError(name: keyof ContactPage['form']['controls'], error?: string): boolean {
    const control = this.form.controls[name];
    return control.touched && (error ? control.hasError(error) : control.invalid);
  }

  async submit(): Promise<void> {
    if (this.submitting()) return;

    this.status.set('idle');
    this.messageKey.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.status.set('error');
      this.messageKey.set('validation');
      queueMicrotask(() => {
        const firstInvalidField = document.querySelector<HTMLElement>('.contact-form [aria-invalid="true"]');
        firstInvalidField?.focus();
      });
      return;
    }

    const endpoint = contactEndpoint();
    if (!endpoint) {
      this.status.set('error');
      this.messageKey.set('configuration');
      return;
    }

    this.submitting.set(true);
    try {
      const payload = this.form.getRawValue();
      await firstValueFrom(
        this.http.post(endpoint, {
          ...payload,
          language: this.i18n.language(),
        }),
      );
      this.form.reset();
      this.status.set('success');
      this.messageKey.set('success');
    } catch (error: unknown) {
      this.status.set('error');
      this.messageKey.set(error instanceof HttpErrorResponse && error.status === 429 ? 'rate-limit' : 'send');
    } finally {
      this.submitting.set(false);
    }
  }
}
