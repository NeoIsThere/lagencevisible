import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ApiService } from "../api.service";
import type { Lead } from "../models";

@Component({
  selector: "app-history",
  templateUrl: "./history.component.html",
  styleUrl: "./history.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoryComponent {
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);
  readonly leads = signal<Lead[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  constructor() {
    this.api.history().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ leads }) => { this.leads.set(leads); this.loading.set(false); },
      error: () => { this.error.set("History could not be loaded."); this.loading.set(false); },
    });
  }

  dateFor(lead: Lead): string {
    const value = lead.suppressedAt ?? lead.sentAt ?? lead.rejectedAt ?? lead.createdAt;
    return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
  }
}
