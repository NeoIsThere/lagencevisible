import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ApiService } from "../api.service";
import type { DatabasePage, DatabaseTableSummary } from "../models";

@Component({
  selector: "app-database",
  templateUrl: "./database.component.html",
  styleUrl: "./database.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatabaseComponent {
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly pageSize = 50;

  readonly Math = Math;
  readonly tables = signal<DatabaseTableSummary[]>([]);
  readonly selectedTable = signal("leads");
  readonly page = signal<DatabasePage | null>(null);
  readonly loading = signal(true);
  readonly catalogError = signal<string | null>(null);
  readonly pageError = signal<string | null>(null);
  readonly error = computed(() => this.pageError() ?? this.catalogError());
  private catalogRequestId = 0;
  private pageRequestId = 0;

  constructor() {
    this.loadCatalog();
  }

  selectTable(table: string): void {
    if (table === this.selectedTable() && this.page()) return;
    this.selectedTable.set(table);
    this.page.set(null);
    this.loadPage(0);
  }

  previous(): void {
    const page = this.page();
    if (page && page.offset > 0) this.loadPage(Math.max(0, page.offset - page.limit));
  }

  next(): void {
    const page = this.page();
    if (page && page.offset + page.limit < page.total) this.loadPage(page.offset + page.limit);
  }

  refresh(): void {
    this.loadCatalog(false);
    this.loadPage(this.page()?.offset ?? 0);
  }

  cellValue(value: unknown): string {
    if (value === null || value === undefined) return "NULL";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  }

  private loadCatalog(loadSelected = true): void {
    const requestId = ++this.catalogRequestId;
    this.api.databaseTables().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ tables }) => {
        if (requestId !== this.catalogRequestId) return;
        this.tables.set(tables);
        this.catalogError.set(null);
        if (!loadSelected) return;
        if (!tables.length) {
          this.page.set(null);
          this.loading.set(false);
          this.pageError.set("No application-owned database table is available.");
          return;
        }
        if (!tables.some((table) => table.name === this.selectedTable())) {
          this.selectedTable.set(tables[0].name);
        }
        this.loadPage(0);
      },
      error: () => {
        if (requestId !== this.catalogRequestId) return;
        this.loading.set(false);
        this.catalogError.set("The database catalog could not be loaded.");
      },
    });
  }

  private loadPage(offset: number): void {
    const table = this.selectedTable();
    const requestId = ++this.pageRequestId;
    this.loading.set(true);
    this.pageError.set(null);
    this.api.databasePage(table, this.pageSize, offset)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (page) => {
          if (requestId !== this.pageRequestId || table !== this.selectedTable()) return;
          this.page.set(page);
          this.loading.set(false);
        },
        error: () => {
          if (requestId !== this.pageRequestId || table !== this.selectedTable()) return;
          this.loading.set(false);
          this.pageError.set("This database table could not be loaded.");
        },
      });
  }
}
