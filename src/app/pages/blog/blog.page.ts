import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  BLOG_ARTICLES,
  BLOG_CATEGORY_KEYS,
  BLOG_CATEGORY_LABELS,
  BlogCategoryKey,
  localizeBlogArticle,
} from '../../core/blog.data';
import { LanguageService } from '../../core/language.service';
import { FinalCtaComponent } from '../../shared/final-cta/final-cta.component';

type CategoryFilter = BlogCategoryKey | 'all';

@Component({
  selector: 'app-blog-page',
  imports: [RouterLink, FinalCtaComponent],
  templateUrl: './blog.page.html',
})
export class BlogPage {
  readonly i18n = inject(LanguageService);
  readonly activeCategory = signal<CategoryFilter>('all');

  readonly categories = computed<readonly { key: CategoryFilter; label: string }[]>(() => {
    const language = this.i18n.language();
    return [
      { key: 'all', label: language === 'fr' ? 'Tous' : 'All' },
      ...BLOG_CATEGORY_KEYS.map((key) => ({
        key,
        label: BLOG_CATEGORY_LABELS[key][language],
      })),
    ];
  });

  readonly articles = computed(() => {
    const language = this.i18n.language();
    return BLOG_ARTICLES.map((article) => localizeBlogArticle(article, language));
  });

  readonly filteredArticles = computed(() => {
    const activeCategory = this.activeCategory();
    const articles = this.articles();
    return activeCategory === 'all'
      ? articles
      : articles.filter((article) => article.category === activeCategory);
  });
}
