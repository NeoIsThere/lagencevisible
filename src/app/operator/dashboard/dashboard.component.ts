import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { HttpErrorResponse } from "@angular/common/http";
import { finalize, timer } from "rxjs";
import { RouterLink, RouterLinkActive } from "@angular/router";
import { ApiService } from "../api.service";
import type { Lead } from "../models";
import { operatorApiUrl } from "../../core/site.config";

@Component({
  selector: "app-dashboard",
  imports: [RouterLink, RouterLinkActive],
  templateUrl: "./dashboard.component.html",
  styleUrl: "./dashboard.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardComponent {
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly euroFormatter = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  });

  readonly leads = signal<Lead[]>([]);
  readonly total = signal(0);
  readonly loading = signal(true);
  readonly processing = signal<{ id: string; action: "send" | "reject" } | null>(null);
  readonly queueError = signal<string | null>(null);
  readonly actionError = signal<{ id: string; message: string } | null>(null);
  private queueRequestInFlight = false;
  private queueRefreshPending = false;
  private queueVersion = 0;

  constructor() {
    timer(0, 15_000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (!this.processing()) this.loadQueue(false);
      });
  }

  act(current: Lead, action: "send" | "reject"): void {
    if (this.processing()) return;
    if (action === "send" && this.emailIsPlaceholder(current)) return;
    this.queueVersion += 1;
    this.processing.set({ id: current.id, action });
    this.actionError.set(null);
    const request = action === "send" ? this.api.send(current.id) : this.api.reject(current.id);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.leads.update((leads) => leads.filter((lead) => lead.id !== current.id));
        this.total.update((total) => Math.max(0, total - 1));
        this.processing.set(null);
        this.loadQueue(false);
      },
      error: (error: HttpErrorResponse) => {
        this.actionError.set({
          id: current.id,
          message: this.apiErrorMessage(error, "The action could not be completed."),
        });
        this.processing.set(null);
      },
    });
  }

  auditScore(lead: Lead, key: "performance" | "accessibility" | "bestPractices" | "seo"): string {
    const value = lead.audit?.[key];
    return typeof value === "number" ? String(value) : "—";
  }

  qualificationSummary(value: string): string {
    const normalized = value.replace(/\s+/g, " ").trim();
    if (normalized.length <= 160) return normalized;
    const firstSentence = normalized.slice(0, 160).match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim();
    return firstSentence ?? `${normalized.slice(0, 157).trimEnd()}…`;
  }

  conditionLabel(condition: Lead["websiteCondition"]): string {
    if (!condition) return "Small web project";
    return condition.classification === "NO_WEBSITE"
      ? "Website not discovered"
      : condition.classification === "SEVERELY_OUTDATED"
        ? "Severely outdated"
        : condition.classification === "SEVERELY_POOR" ? "Severely poor" : "Website review";
  }

  rankingValue(lead: Lead, dimension: "activity" | "ability" | "digitalIntent" | "purchaseFit" | "reachability" | "need"): string {
    if (!lead.ranking || lead.ranking.unknownDimensions.includes(dimension)) return "Unknown";
    return String(lead.ranking[dimension]);
  }

  signalLabel(kind: string): string {
    const label = kind.toLowerCase().replaceAll("_", " ");
    return label.charAt(0).toUpperCase() + label.slice(1);
  }

  formatEuro(value: number): string {
    return this.euroFormatter.format(value);
  }

  screenshotUrl(path: string): string {
    return operatorApiUrl(path);
  }

  strategyLabel(strategy: NonNullable<Lead["deliveryApproach"]>["strategy"]): string {
    return {
      optimize_existing: "Optimize existing",
      partial_rebuild: "Partial rebuild",
      full_rebuild: "Full rebuild",
      migrate_platform: "Platform migration",
      new_website: "New website",
    }[strategy];
  }

  isProcessing(lead: Lead, action?: "send" | "reject"): boolean {
    const processing = this.processing();
    return processing?.id === lead.id && (!action || processing.action === action);
  }

  emailIsPlaceholder(lead: Lead): boolean {
    return lead.email.isPlaceholder === true
      || [lead.email.subject, lead.email.body].some((value) => value?.toLowerCase().includes("<email goes here>"));
  }

  private loadQueue(showLoader: boolean): void {
    if (this.queueRequestInFlight) {
      this.queueRefreshPending = true;
      return;
    }

    this.queueRequestInFlight = true;
    this.queueRefreshPending = false;
    const requestVersion = this.queueVersion;
    if (showLoader) this.loading.set(true);
    this.api.reviewQueue().pipe(
      finalize(() => {
        this.queueRequestInFlight = false;
        if (this.queueRefreshPending && !this.processing()) this.loadQueue(false);
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: ({ leads, total }) => {
        if (requestVersion !== this.queueVersion) return;
        this.leads.set(leads);
        this.total.set(total);
        this.loading.set(false);
        this.queueError.set(null);
      },
      error: () => {
        if (requestVersion !== this.queueVersion) return;
        this.loading.set(false);
        this.queueError.set("The local API is unavailable. The page will keep trying.");
      },
    });
  }

  private apiErrorMessage(error: HttpErrorResponse, fallback: string): string {
    if (typeof error.error === "string" && error.error.trim()) return error.error;
    if (error.error && typeof error.error === "object") {
      const message = (error.error as { error?: unknown }).error;
      if (typeof message === "string" && message.trim()) return message;
    }
    return fallback;
  }
}
