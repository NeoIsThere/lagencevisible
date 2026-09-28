import { DatePipe } from "@angular/common";
import { ChangeDetectionStrategy, Component, ElementRef, inject, OnDestroy, signal, viewChild } from "@angular/core";
import { Subscription } from "rxjs";
import { ApiService } from "../api.service";
import type { ApplicationLogsResponse } from "../models";

@Component({
  selector: "app-logs-dialog",
  imports: [DatePipe],
  templateUrl: "./logs-dialog.component.html",
  styleUrl: "./logs-dialog.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LogsDialogComponent implements OnDestroy {
  private readonly api = inject(ApiService);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>("dialog");
  private request?: Subscription;
  private timer?: ReturnType<typeof setInterval>;
  private appliedQuery = "";
  readonly opened = signal(false);
  readonly loading = signal(false);
  readonly live = signal(true);
  readonly error = signal("");
  readonly copyStatus = signal("");
  readonly service = signal("all");
  readonly level = signal("all");
  readonly query = signal("");
  readonly result = signal<ApplicationLogsResponse | null>(null);
  readonly updatedAt = signal<Date | null>(null);

  open(): void {
    if (this.opened()) return;
    this.dialog().nativeElement.showModal();
    this.opened.set(true);
    this.copyStatus.set("");
    this.refresh();
    this.timer = setInterval(() => {
      if (this.live() && !this.loading() && document.visibilityState !== "hidden") this.refresh();
    }, 5_000);
  }

  close(): void {
    this.dialog().nativeElement.close();
    this.stop();
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
    this.request?.unsubscribe();
    this.loading.set(false);
    this.opened.set(false);
  }

  filter(kind: "service" | "level", value: string): void {
    this[kind].set(value);
    this.result.set(null);
    this.refresh();
  }

  search(event: Event): void {
    event.preventDefault();
    this.appliedQuery = this.query().trim();
    this.result.set(null);
    this.refresh();
  }

  refresh(): void {
    if (!this.opened()) return;
    this.request?.unsubscribe();
    this.loading.set(true);
    this.error.set("");
    this.request = this.api.applicationLogs({ service: this.service(), level: this.level(), q: this.appliedQuery }).subscribe({
      next: (result) => {
        this.result.set(result);
        this.updatedAt.set(new Date());
        this.loading.set(false);
      },
      error: (error: { status?: number }) => {
        this.error.set(error.status === 401 ? "Your session expired. Log in again to view logs."
          : error.status === 404 ? "Logs are not available on this backend version yet. Deploy the backend update and try again."
          : "Unable to load logs. Check the connection and try Refresh.");
        if (error.status === 401 || error.status === 404) this.live.set(false);
        this.loading.set(false);
      },
    });
  }

  async copy(): Promise<void> {
    const text = this.result()?.entries.map((entry) => `${entry.createdAt} [${entry.service}] [${entry.level}] ${entry.message}`).join("\n");
    if (!text) return;
    try { await navigator.clipboard.writeText(text); this.copyStatus.set("Logs copied."); }
    catch { this.copyStatus.set("Copy unavailable. Select the log text to copy it."); }
  }

  ngOnDestroy(): void { this.stop(); }
}
