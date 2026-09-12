import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./operator/login/login.component').then((m) => m.LoginComponent),
    data: { robots: 'noindex, nofollow' },
  },
  {
    path: 'operator',
    loadComponent: () => import('./operator/operator-shell.component').then((m) => m.OperatorShellComponent),
    loadChildren: () => import('./operator/operator.routes').then((m) => m.operatorRoutes),
    data: { robots: 'noindex, nofollow' },
  },
  {
    path: '',
    loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePage),
    data: {
      title: { fr: 'Création et amélioration de sites web — L’agence visible', en: 'Website creation and improvement — L’agence visible' },
      description: {
        fr: "Nous créons des sites web qui permettent aux entreprises d’être trouvées sur Google, comprises par les assistants IA et contactées par leurs futurs clients.",
        en: 'We create websites that help businesses appear in Google results, make sense to AI assistants and turn visits into enquiries.',
      },
    },
  },
  {
    path: 'services',
    loadComponent: () => import('./pages/services/services.page').then((m) => m.ServicesPage),
    data: {
      title: { fr: 'Création, amélioration et analyse de sites web | L’agence visible', en: 'Website creation, improvement and analysis | L’agence visible' },
      description: {
        fr: 'Création de site web, amélioration ou modification d’un site existant et analyse des points à corriger.',
        en: 'Website creation, thoughtful improvements to existing sites and a clear review of what needs attention.',
      },
    },
  },
  {
    path: 'visibilite-google-ia',
    loadComponent: () => import('./pages/visibility/visibility.page').then((m) => m.VisibilityPage),
    data: {
      title: { fr: 'Analyse et amélioration de site web | L’agence visible', en: 'Website analysis and improvement | L’agence visible' },
      description: {
        fr: 'Une analyse claire du contenu, de la structure, de l’affichage mobile et des points à améliorer sur votre site.',
        en: 'A clear review of your website’s content, structure, mobile experience and opportunities for improvement.',
      },
    },
  },
  {
    path: 'a-propos',
    loadComponent: () => import('./pages/about/about.page').then((m) => m.AboutPage),
    data: {
      title: { fr: 'Qui sommes-nous ? | L’agence visible', en: 'About us | L’agence visible' },
      description: {
        fr: 'Des ingénieurs expérimentés qui créent et améliorent des sites web clairs, efficaces et attractifs.',
        en: 'Experienced engineers creating and improving clear, effective and engaging websites.',
      },
    },
  },
  {
    path: 'blog',
    loadComponent: () => import('./pages/blog/blog.page').then((m) => m.BlogPage),
    data: {
      title: { fr: 'Conseils pour créer et améliorer votre site | L’agence visible', en: 'Advice for creating and improving your website | L’agence visible' },
      description: {
        fr: 'Des conseils simples pour rendre votre site plus clair, plus utile et plus facile à trouver.',
        en: 'Straightforward advice to make your website clearer, more useful and easier to find.',
      },
    },
  },
  {
    path: 'blog/:slug',
    loadComponent: () => import('./pages/blog-article/blog-article.page').then((m) => m.BlogArticlePage),
  },
  {
    path: 'contact',
    loadComponent: () => import('./pages/contact/contact.page').then((m) => m.ContactPage),
    data: {
      title: { fr: 'Prendre contact | L’agence visible', en: 'Get in touch | L’agence visible' },
      description: {
        fr: 'Présentez votre site ou votre besoin de création, de modification, d’amélioration ou d’analyse.',
        en: 'Tell us about the website you would like to create, update, improve or review.',
      },
    },
  },
  {
    path: 'mentions-legales',
    loadComponent: () => import('./pages/legal/legal.page').then((m) => m.LegalPage),
    data: {
      title: { fr: 'Mentions légales | L’agence visible', en: 'Legal notice | L’agence visible' },
      description: { fr: 'Mentions légales du site L’agence visible.', en: 'Legal notice for L’agence visible.' },
    },
  },
  {
    path: 'politique-confidentialite',
    loadComponent: () => import('./pages/privacy/privacy.page').then((m) => m.PrivacyPage),
    data: {
      title: { fr: 'Politique de confidentialité | L’agence visible', en: 'Privacy policy | L’agence visible' },
      description: {
        fr: 'Comment L’agence visible collecte, utilise et protège les données envoyées via son formulaire.',
        en: 'How L’agence visible collects, uses and protects data submitted through its form.',
      },
    },
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found.page').then((m) => m.NotFoundPage),
    data: {
      title: { fr: 'Page introuvable | L’agence visible', en: 'Page not found | L’agence visible' },
      description: { fr: 'Cette page est introuvable.', en: 'This page could not be found.' },
      robots: 'noindex, follow',
    },
  },
];
