import { Language, LocalizedText } from './language.service';

export const BLOG_CATEGORY_KEYS = [
  'visibility-ai',
  'online-presence',
  'website',
  'conversion',
] as const;

export type BlogCategoryKey = (typeof BLOG_CATEGORY_KEYS)[number];

export const BLOG_CATEGORY_LABELS: Record<BlogCategoryKey, LocalizedText> = {
  'visibility-ai': { fr: 'Visibilité & IA', en: 'Visibility & AI' },
  'online-presence': { fr: 'Présence en ligne', en: 'Online presence' },
  website: { fr: 'Site web', en: 'Website' },
  conversion: { fr: 'Conversion', en: 'Conversion' },
};

export interface BlogArticle {
  slug: string;
  title: LocalizedText;
  description: LocalizedText;
  category: BlogCategoryKey;
  date: string;
  readingMinutes: number;
}

export interface LocalizedBlogArticle {
  slug: string;
  title: string;
  description: string;
  category: BlogCategoryKey;
  categoryLabel: string;
  date: string;
  displayDate: string;
  author: string;
  readingLabel: string;
}

export const BLOG_ARTICLES: readonly BlogArticle[] = [
  {
    slug: 'entreprise-invisible-ere-ia',
    title: {
      fr: 'Pourquoi une entreprise sans site devient invisible à l’ère de l’IA',
      en: 'Why a business without a website becomes invisible in the age of AI',
    },
    description: {
      fr: 'Comment vos clients cherchent, où les IA trouvent leurs informations et pourquoi un site officiel est devenu essentiel.',
      en: 'How your customers search, where AI assistants find information, and why an official website has become essential.',
    },
    category: 'visibility-ai',
    date: '2026-06-18',
    readingMinutes: 7,
  },
  {
    slug: 'google-maps-instagram-sans-site',
    title: {
      fr: 'Google Maps et Instagram suffisent-ils sans site web ?',
      en: 'Are Google Maps and Instagram enough without a website?',
    },
    description: {
      fr: 'Les limites d’une présence dépendante des plateformes et la valeur d’un domaine officiel que vous contrôlez.',
      en: 'The limits of relying on platforms and the value of an official domain that you control.',
    },
    category: 'online-presence',
    date: '2026-06-05',
    readingMinutes: 6,
  },
  {
    slug: 'visible-dans-chatgpt',
    title: {
      fr: 'Comment rendre son entreprise visible dans ChatGPT ?',
      en: 'How can you make your business easier for ChatGPT to find?',
    },
    description: {
      fr: 'Des bases concrètes pour être plus facile à trouver et à comprendre par les assistants IA, sans fausse garantie.',
      en: 'Practical foundations that help AI assistants find and understand your business, without making false promises.',
    },
    category: 'visibility-ai',
    date: '2026-05-22',
    readingMinutes: 7,
  },
  {
    slug: 'signes-besoin-nouveau-site',
    title: {
      fr: 'Les signes que votre entreprise a besoin d’un nouveau site',
      en: 'Signs that your business needs a new website',
    },
    description: {
      fr: 'Site ancien, mauvais affichage mobile, informations incorrectes : les signaux qui ne trompent pas.',
      en: 'An outdated website, poor mobile display, or incorrect information: the warning signs to watch.',
    },
    category: 'website',
    date: '2026-05-08',
    readingMinutes: 5,
  },
  {
    slug: 'comment-google-comprend-entreprise',
    title: {
      fr: 'Comment Google comprend-il votre entreprise ?',
      en: 'How does Google understand your business?',
    },
    description: {
      fr: 'Pages, titres, localisation, liens et données structurées : une explication simple du travail de Google.',
      en: 'Pages, titles, location, links, and structured data: a clear explanation of how Google interprets a business.',
    },
    category: 'visibility-ai',
    date: '2026-04-24',
    readingMinutes: 7,
  },
  {
    slug: 'site-pense-mobile',
    title: {
      fr: 'Pourquoi votre site doit être pensé pour le mobile',
      en: 'Why your website should be designed for mobile',
    },
    description: {
      fr: 'Rapidité, lisibilité et contact immédiat : ce que vos visiteurs attendent réellement sur leur téléphone.',
      en: 'Speed, readability, and easy contact: what visitors expect on their phones.',
    },
    category: 'website',
    date: '2026-04-10',
    readingMinutes: 5,
  },
  {
    slug: 'contenu-site-entreprise',
    title: {
      fr: 'Que faut-il mettre sur un site d’entreprise ?',
      en: 'What should a business website include?',
    },
    description: {
      fr: 'Les pages et informations qui permettent à un visiteur de comprendre votre activité et de vous contacter.',
      en: 'The pages and information visitors need to understand your business and get in touch.',
    },
    category: 'website',
    date: '2026-03-27',
    readingMinutes: 6,
  },
  {
    slug: 'transformer-visiteurs-demandes',
    title: {
      fr: 'Comment transformer les visiteurs en demandes ?',
      en: 'How can you turn website visitors into enquiries?',
    },
    description: {
      fr: 'Un message clair, des preuves utiles et un formulaire court pour faciliter le passage à l’action.',
      en: 'A clear message, useful evidence, and a short form that make it easier to take action.',
    },
    category: 'conversion',
    date: '2026-03-13',
    readingMinutes: 6,
  },
];

export function localizeBlogArticle(
  article: BlogArticle,
  language: Language,
): LocalizedBlogArticle {
  const locale = language === 'fr' ? 'fr-FR' : 'en-GB';
  const displayDate = new Intl.DateTimeFormat(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${article.date}T00:00:00Z`));

  return {
    slug: article.slug,
    title: article.title[language],
    description: article.description[language],
    category: article.category,
    categoryLabel: BLOG_CATEGORY_LABELS[article.category][language],
    date: article.date,
    displayDate,
    author:
      language === 'fr' ? 'l’équipe de L’agence visible' : 'the team at L’agence visible',
    readingLabel:
      language === 'fr'
        ? `${article.readingMinutes} min de lecture`
        : `${article.readingMinutes} min read`,
  };
}
