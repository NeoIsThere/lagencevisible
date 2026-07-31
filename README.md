# L’agence visible — site d’agence

Site vitrine statique bilingue français/anglais pour une agence web basée à Nice. Le projet utilise Angular 21, des composants standalone, TypeScript strict, SCSS, un blog Markdown, le prerender Angular et des URL propres compatibles avec GitHub Pages.

## Démarrage

```bash
npm install
npm start
```

Le site local est disponible sur `http://localhost:4201/`.

## Configuration avant publication

Le domaine public, l’email et les informations légales utilisées par le site sont centralisés dans `src/app/core/site.config.ts`. Les URL canoniques, `robots.txt` et le sitemap utilisent `https://lagencevisible.com`.

Avant publication, vérifier que les coordonnées légales correspondent toujours à la situation de l’entreprise et que le domaine personnalisé est configuré dans les paramètres GitHub Pages et chez le registrar.

### Formulaire

Configurer l’URL publique de réception dans `public/site-config.js` :

```js
window.__SITE_CONFIG__ = {
  CONTACT_FORM_ENDPOINT: 'https://votre-service.example/contact',
};
```

L’endpoint doit accepter un `POST` JSON, appliquer côté serveur la validation et la limitation de débit, puis envoyer le message avec Resend. La clé API Resend doit rester dans les secrets de cette fonction serveur : elle ne doit jamais être ajoutée au code Angular, à `site-config.js` ou à l’artefact GitHub Pages.

## Blog Markdown

Les huit articles français se trouvent dans `public/content/blog` et leurs versions anglaises dans `public/content/blog/en`. Leurs métadonnées bilingues sont centralisées dans `src/app/core/blog.data.ts`. Pour ajouter un article, créer les deux fichiers `{slug}.md` et ajouter sa fiche aux métadonnées.

## Vérifications

```bash
npm test -- --watch=false
npm run build
```

Le build de production est écrit dans `dist/presence-web/browser`. Angular génère statiquement les 16 routes déclarées, dont les huit articles. Chaque page dispose ainsi de son propre HTML et d’une URL sans `#`.

## Déploiement GitHub Pages

Le workflow `.github/workflows/deploy-pages.yml` installe les dépendances, exécute les tests, prérend le site avec le bon `base-href`, ajoute le fallback `404.html` et déploie l’artefact Pages à chaque push sur `main` ou `master`.

Dans les paramètres GitHub du dépôt :

1. choisir **Settings → Pages → Source → GitHub Actions** ;
2. vérifier que les Actions sont autorisées dans **Settings → Actions → General** ;
3. si un domaine personnalisé est utilisé, le configurer dans **Settings → Pages**, puis mettre à jour les DNS chez le registrar (avec ce workflow GitHub Actions, un fichier `CNAME` n’est pas requis) ;
4. tester le formulaire depuis l’URL Pages finale et autoriser cette origine dans la configuration CORS du prestataire de formulaire ;
5. vérifier les mentions légales, la politique de confidentialité, les coordonnées et tous les liens avant publication ;
6. après publication, ajouter le domaine à Google Search Console et envoyer l’URL `/sitemap.xml`.

La langue choisie est mémorisée dans le navigateur et conservée lors de la navigation. Le HTML prérendu de secours reste français ; l’anglais est appliqué côté navigateur après hydratation.

La version française est la version canonique et indexable. Le bouton anglais est une fonctionnalité de lecture, pas une seconde version SEO. Pour positionner aussi les contenus anglais, il faudra publier et pré-générer des URL dédiées sous `/en/` plutôt que d’utiliser uniquement `?lang=en`.

Sur une GitHub Project Page (`utilisateur.github.io/depot`), `robots.txt` est servi sous `/depot/robots.txt` et non à la racine de l’origine. Il faut donc envoyer directement le sitemap dans Search Console ; un domaine personnalisé à la racine évite cette limitation.
