import { Component, computed, effect, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeoService } from '../../core/seo.service';
import { SITE_CONFIG } from '../../core/site.config';
import { FinalCtaComponent } from '../../shared/final-cta/final-cta.component';
import { SiteMockupComponent } from '../../shared/site-mockup/site-mockup.component';
import { LanguageService } from '../../core/language.service';

const FAQ_FR: readonly (readonly [string, string])[] = [
  ['Pourquoi mon entreprise a-t-elle besoin d’un site ?', 'Votre site est votre présence officielle en ligne. Il permet à vos futurs clients, à Google et aux assistants IA de comprendre votre activité et de trouver les informations nécessaires pour vous contacter.'],
  ['Google Maps ou Instagram ne suffisent-ils pas ?', 'Ces plateformes sont utiles, mais elles ne remplacent pas un site que vous contrôlez. Un site vous permet de présenter clairement votre activité, votre équipe et vos informations de contact.'],
  ['Mon entreprise peut-elle apparaître dans ChatGPT ?', 'Un site clair, accessible et bien structuré augmente les chances que votre entreprise soit trouvée et comprise par les assistants IA. Personne ne peut cependant garantir une citation précise.'],
  ['Par quoi commence une création de site ?', 'Nous commençons par comprendre votre entreprise, vos visiteurs et les informations que le site doit rendre faciles à trouver.'],
  ['Dois-je rédiger les textes moi-même ?', 'Non. Vous nous transmettez les informations importantes et nous vous aidons à les transformer en textes simples, clairs et professionnels.'],
  ['Dois-je fournir les photos ?', 'Les vraies photos de votre entreprise, de votre équipe ou de vos locaux sont recommandées. Nous vous indiquons précisément les visuels nécessaires.'],
  ['Pouvez-vous refaire mon ancien site ?', 'Oui. Nous pouvons conserver les contenus utiles et reconstruire le site pour le rendre plus moderne, plus clair et plus efficace.'],
  ['Le site fonctionnera-t-il sur mobile ?', 'Oui. Tous nos sites sont conçus pour fonctionner correctement sur téléphone, tablette et ordinateur.'],
  ['Le site sera-t-il visible sur Google ?', 'Nous configurons les bases nécessaires à son exploration et à son indexation. Aucun prestataire ne peut garantir une position, mais le site sera construit pour être correctement compris par les moteurs.'],
  ['Proposez-vous des sites en anglais ?', 'Oui. Nous pouvons créer des sites en français et en anglais.'],
  ['Le site m’appartiendra-t-il ?', 'Oui. Les conditions de propriété, d’accès et de transfert sont clairement définies avant de commencer.'],
  ['Pouvez-vous modifier un site existant ?', 'Oui. Nous pouvons analyser sa structure, corriger ses contenus et améliorer son affichage ou son utilisation.'],
  ['Travaillez-vous à distance ?', 'Oui. Nous pouvons organiser et réaliser votre projet entièrement à distance.'],
  ['Comment vous contacter ?', 'Vous pouvez nous présenter votre site ou nous envoyer directement un message depuis le formulaire de contact.'],
];

const FAQ_EN: readonly (readonly [string, string])[] = [
  ['Why does my business need a website?', 'Your website is your official online presence. It enables future customers, Google and AI assistants to understand your business and find the information they need to contact you.'],
  ['Aren’t Google Maps or Instagram enough?', 'These platforms are useful, but they do not replace a website you control. A website lets you clearly present your business, your team and your contact details.'],
  ['Can my business appear in ChatGPT?', 'A clear, accessible and well-structured website makes your business easier for AI assistants to find and understand. No one can guarantee a specific citation, however.'],
  ['How does a website project begin?', 'We begin by understanding your business, your visitors and the information your website needs to present clearly.'],
  ['Do I need to write the copy myself?', 'No. You provide the important information and we help turn it into clear, concise and professional copy.'],
  ['Do I need to provide photographs?', 'Real photographs of your business, team or premises are recommended. We tell you exactly which images are needed.'],
  ['Can you rebuild my old website?', 'Yes. We can keep useful content and rebuild the website so that it is more modern, clear and effective.'],
  ['Will the website work on mobile?', 'Yes. Every website we create is designed to work properly on phones, tablets and computers.'],
  ['Will the website be visible on Google?', 'We configure the foundations required for crawling and indexing. No provider can guarantee a ranking, but the website will be built to be clearly understood by search engines.'],
  ['Do you create English-language websites?', 'Yes. We can create websites in French and English.'],
  ['Will I own the website?', 'Yes. Ownership, access and transfer terms are clearly defined before we begin.'],
  ['Can you modify an existing website?', 'Yes. We can analyse its structure, correct its content and improve its appearance or usability.'],
  ['Do you work remotely?', 'Yes. We can organise and deliver your project entirely remotely.'],
  ['How can I contact you?', 'You can tell us about your website or send us a message directly through the contact form.'],
];

@Component({
  selector: 'app-home-page',
  imports: [RouterLink, SiteMockupComponent, FinalCtaComponent],
  templateUrl: './home.page.html',
})
export class HomePage {
  private readonly seo = inject(SeoService);
  readonly i18n = inject(LanguageService);
  readonly faqs = computed(() => this.i18n.t(FAQ_FR, FAQ_EN));

  constructor() {
    effect(() => {
      const baseUrl = SITE_CONFIG.siteUrl.replace(/\/+$/, '');
      this.seo.setJsonLd('home-organization-jsonld', {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'WebSite',
            '@id': `${baseUrl}/#website`,
            name: SITE_CONFIG.brand,
            url: `${baseUrl}/`,
            inLanguage: this.i18n.language(),
          },
          {
            '@type': ['Organization', 'ProfessionalService'],
            '@id': `${baseUrl}/#organization`,
            name: SITE_CONFIG.brand,
            url: `${baseUrl}/`,
            email: SITE_CONFIG.email,
            inLanguage: this.i18n.language(),
          },
          { '@type': 'FAQPage', inLanguage: this.i18n.language(), mainEntity: this.faqs().map(([name, text]) => ({ '@type': 'Question', name, acceptedAnswer: { '@type': 'Answer', text } })) },
        ],
      });
    });
  }
}
