import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { marked } from 'marked';
import { LanguageService } from './language.service';

export interface ArticleContent { html: string; headings: { id: string; text: string }[]; }

@Injectable({ providedIn: 'root' })
export class BlogService {
  private readonly http = inject(HttpClient);
  private readonly i18n = inject(LanguageService);

  load(slug: string): Observable<ArticleContent> {
    const languagePath = this.i18n.language() === 'en' ? 'en/' : '';
    return this.http.get(`content/blog/${languagePath}${slug}.md`, { responseType: 'text' }).pipe(map((markdown) => this.render(markdown)));
  }

  private render(markdown: string): ArticleContent {
    const headings = [...markdown.matchAll(/^##\s+(.+)$/gm)].map((match) => ({ text: match[1].trim(), id: this.slugify(match[1]) }));
    let index = 0;
    const parsed = marked.parse(markdown, { async: false }) as string;
    const html = parsed.replace(/<h2>(.*?)<\/h2>/g, (full, content: string) => {
      const heading = headings[index++];
      return heading ? `<h2 id="${heading.id}">${content}</h2>` : full;
    });
    return { html, headings };
  }

  private slugify(value: string): string {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }
}
