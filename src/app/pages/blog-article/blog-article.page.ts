import { Component, inject, Injector, OnDestroy, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, combineLatest, map, of, Subscription, switchMap } from 'rxjs';
import {
  BLOG_ARTICLES,
  localizeBlogArticle,
  LocalizedBlogArticle,
} from '../../core/blog.data';
import { ArticleContent, BlogService } from '../../core/blog.service';
import { Language, LanguageService } from '../../core/language.service';
import { SeoService } from '../../core/seo.service';
import { SITE_CONFIG } from '../../core/site.config';

type ArticleLoadResult =
  | {
      kind: 'ready';
      article: LocalizedBlogArticle;
      content: ArticleContent;
      language: Language;
    }
  | { kind: 'not-found'; language: Language; slug: string };

@Component({
  selector: 'app-blog-article-page',
  imports: [RouterLink],
  templateUrl: './blog-article.page.html',
})
export class BlogArticlePage implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly blog = inject(BlogService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly seo = inject(SeoService);
  private readonly injector = inject(Injector);
  readonly i18n = inject(LanguageService);
  private readonly subscription: Subscription;

  readonly article = signal<LocalizedBlogArticle | undefined>(undefined);
  readonly content = signal<SafeHtml>('');
  readonly headings = signal<ArticleContent['headings']>([]);
  readonly loading = signal(true);
  readonly notFound = signal(false);
  readonly related = signal<LocalizedBlogArticle[]>([]);

  constructor() {
    const languageChanges = toObservable(this.i18n.language, { injector: this.injector });

    this.subscription = combineLatest([this.route.paramMap, languageChanges])
      .pipe(
        switchMap(([params, language]) => {
          const slug = params.get('slug') ?? '';
          this.startLoading();

          const sourceArticle = BLOG_ARTICLES.find((item) => item.slug === slug);
          if (!sourceArticle) {
            return of<ArticleLoadResult>({ kind: 'not-found', language, slug });
          }

          const article = localizeBlogArticle(sourceArticle, language);
          return this.blog.load(slug).pipe(
            map(
              (content): ArticleLoadResult => ({
                kind: 'ready',
                article,
                content,
                language,
              }),
            ),
            catchError(() =>
              of<ArticleLoadResult>({ kind: 'not-found', language, slug }),
            ),
          );
        }),
      )
      .subscribe((result) => {
        if (result.kind === 'not-found') {
          this.showNotFound(result.slug, result.language);
          return;
        }

        const { article, content, language } = result;
        this.article.set(article);
        this.content.set(this.sanitizer.bypassSecurityTrustHtml(content.html));
        this.headings.set(content.headings);
        this.related.set(
          BLOG_ARTICLES.filter(
            (item) => item.slug !== article.slug && item.category === article.category,
          )
            .slice(0, 2)
            .map((item) => localizeBlogArticle(item, language)),
        );
        this.updateMetadata(article, language);
        this.loading.set(false);
      });
  }

  private startLoading(): void {
    this.loading.set(true);
    this.notFound.set(false);
    this.article.set(undefined);
    this.content.set('');
    this.headings.set([]);
    this.related.set([]);
  }

  private showNotFound(slug: string, language: Language): void {
    const title =
      language === 'fr'
        ? `Article introuvable | ${SITE_CONFIG.brand}`
        : `Article not found | ${SITE_CONFIG.brand}`;
    const description =
      language === 'fr'
        ? 'Cet article est introuvable ou a été déplacé.'
        : 'This article could not be found or has been moved.';

    this.seo.update({
      title,
      description,
      path: `/blog/${slug}`,
      robots: 'noindex, follow',
    });
    this.notFound.set(true);
    this.loading.set(false);
  }

  private updateMetadata(article: LocalizedBlogArticle, language: Language): void {
    const baseUrl = SITE_CONFIG.siteUrl.replace(/\/+$/, '');
    const homeUrl = `${baseUrl}/`;
    const blogUrl = `${baseUrl}/blog/`;
    const articleUrl = `${baseUrl}/blog/${article.slug}/`;

    this.seo.update({
      title: `${article.title} | ${SITE_CONFIG.brand}`,
      description: article.description,
      type: 'article',
      path: `/blog/${article.slug}`,
      publishedTime: article.date,
    });
    this.seo.setJsonLd('article-jsonld', {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Article',
          headline: article.title,
          description: article.description,
          inLanguage: language,
          datePublished: article.date,
          dateModified: article.date,
          author: { '@type': 'Organization', name: SITE_CONFIG.brand },
          publisher: { '@type': 'Organization', name: SITE_CONFIG.brand },
          mainEntityOfPage: articleUrl,
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: language === 'fr' ? 'Accueil' : 'Home',
              item: homeUrl,
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: 'Blog',
              item: blogUrl,
            },
            {
              '@type': 'ListItem',
              position: 3,
              name: article.title,
              item: articleUrl,
            },
          ],
        },
      ],
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
