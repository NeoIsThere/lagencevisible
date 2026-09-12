import { HttpErrorResponse } from "@angular/common/http";
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { timer } from "rxjs";
import type { IntegrationDisplayRecord, IntegrationStatus } from "../models";
import { IntegrationsService } from "./integrations.service";

interface DisplayEntry {
  key: string;
  label: string;
  value: string;
  title: string;
  progress: number | null;
}

type StateClass = "operational" | "configured" | "attention" | "unavailable" | "disabled" | "unknown";

@Component({
  selector: "app-integrations",
  templateUrl: "./integrations.component.html",
  styleUrl: "./integrations.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntegrationsComponent {
  private readonly api = inject(IntegrationsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly timestampFormatter = new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  private readonly eurFormatter = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 5,
  });
  private requestInFlight = false;

  readonly dashboard = signal<import("../models").IntegrationsDashboard | null>(null);
  readonly loading = signal(true);
  readonly refreshing = signal(false);
  readonly autoRefresh = signal(true);
  readonly error = signal<string | null>(null);
  readonly lastRefreshedAt = signal<string | null>(null);
  readonly configuredCount = computed(() => this.dashboard()?.integrations.filter((item) => item.configured).length ?? 0);

  constructor() {
    timer(0, 30_000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((tick) => {
        if (tick === 0 || this.autoRefresh()) this.load(tick === 0);
      });
  }

  refresh(): void {
    this.load(!this.dashboard());
  }

  toggleAutoRefresh(): void {
    this.autoRefresh.update((enabled) => !enabled);
    if (this.autoRefresh()) this.load(false);
  }

  stateClass(integration: IntegrationStatus): StateClass {
    switch (integration.status.trim().toLowerCase()) {
      case "online":
      case "recently_operational":
        return "operational";
      case "configured":
        return "configured";
      case "degraded":
        return "attention";
      case "not_configured":
        return "unavailable";
      case "disabled":
        return "disabled";
      default:
        return "unknown";
    }
  }

  statusLabel(status: string): string {
    return this.humanize(status || "unknown");
  }

  recordEntries(record: IntegrationDisplayRecord | null | undefined, redactSecrets = false, showProgress = false): DisplayEntry[] {
    const source = record && typeof record === "object" ? record : {};
    return Object.entries(source).map(([key, rawValue]) => {
      const label = this.humanize(key);
      const value = this.displayValue(key, rawValue, redactSecrets);
      return {
        key,
        label,
        value,
        title: `${label}: ${value}`,
        progress: showProgress ? this.progressFor(key, rawValue, source) : null,
      };
    });
  }

  formatTimestamp(value: string | null | undefined, emptyLabel = "No activity reported"): string {
    if (!value) return emptyLabel;
    const timestamp = new Date(value);
    return Number.isNaN(timestamp.getTime()) ? value : this.timestampFormatter.format(timestamp);
  }

  private load(initial: boolean): void {
    if (this.requestInFlight) return;
    this.requestInFlight = true;
    this.error.set(null);
    if (initial && !this.dashboard()) this.loading.set(true);
    else this.refreshing.set(true);

    this.api.dashboard()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (dashboard) => {
          this.dashboard.set(dashboard);
          this.lastRefreshedAt.set(dashboard.generatedAt || new Date().toISOString());
          this.loading.set(false);
          this.finishRequest();
        },
        error: (error: HttpErrorResponse) => {
          const apiMessage = typeof error.error?.error === "string" ? error.error.error : null;
          this.error.set(apiMessage ?? "Integration status is unavailable.");
          this.loading.set(false);
          this.finishRequest();
        },
      });
  }

  private finishRequest(): void {
    this.requestInFlight = false;
    this.refreshing.set(false);
  }

  private displayValue(key: string, value: unknown, redactSecrets: boolean): string {
    if (redactSecrets && this.isSensitiveKey(key)) {
      return this.hasConfiguredValue(value) ? "Hidden" : "Not configured";
    }
    if (value === null || value === undefined || value === "") return "Not reported";
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (typeof value === "number" && /eur(?:thismonth)?$/i.test(key)) return this.eurFormatter.format(value);
    if (key === "period" && typeof value === "string") return this.humanize(value);
    if (Array.isArray(value)) return value.length ? value.map((item) => this.scalarValue(item)).join(", ") : "None";
    if (typeof value === "object") {
      const nested = value as Record<string, unknown>;
      if ("value" in nested) {
        const unit = typeof nested["unit"] === "string" ? ` ${nested["unit"]}` : "";
        const limit = nested["limit"] === undefined ? "" : ` / ${this.scalarValue(nested["limit"])}${unit}`;
        return `${this.scalarValue(nested["value"])}${unit}${limit}`;
      }
      return Object.entries(nested).map(([nestedKey, nestedValue]) => `${this.humanize(nestedKey)}: ${this.scalarValue(nestedValue)}`).join("; ") || "None";
    }
    return String(value);
  }

  private scalarValue(value: unknown): string {
    if (value === null || value === undefined) return "not reported";
    if (typeof value === "boolean") return value ? "yes" : "no";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  }

  private progressFor(key: string, value: unknown, record: IntegrationDisplayRecord): number | null {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const metric = value as Record<string, unknown>;
      return this.ratio(metric["value"] ?? metric["used"] ?? metric["current"], metric["limit"] ?? metric["max"] ?? metric["maximum"]);
    }

    const matchingLimit: Record<string, string> = {
      requestsAccounted: "monthlyRequestLimit",
      accountedEur: "stopAtEur",
      globalAccountedEur: "globalStopAtEur",
      sentToday: "dailyLimit",
      dailyCapacityUsed: "dailyLimit",
      sentThisMonth: "monthlyLimit",
      monthlyCapacityUsed: "monthlyLimit",
      cityQueriesUsed: "dailyCityQueryLimit",
    };
    const limitKey = matchingLimit[key];
    return limitKey ? this.ratio(value, record[limitKey]) : null;
  }

  private ratio(value: unknown, limit: unknown): number | null {
    const current = this.numericValue(value);
    const maximum = this.numericValue(limit);
    if (current === null || maximum === null || maximum <= 0) return null;
    return Math.min(100, Math.max(0, (current / maximum) * 100));
  }

  private numericValue(value: unknown): number | null {
    if (typeof value === "number") return Number.isFinite(value) ? value : null;
    if (typeof value !== "string" || !value.trim()) return null;
    const parsed = Number(value.replace(/[^0-9.-]/g, ""));
    return Number.isFinite(parsed) ? parsed : null;
  }

  private isSensitiveKey(key: string): boolean {
    if (/(?:configured|required|available|enabled)$/i.test(key)) return false;
    return /secret|token|password|credential|api.?key|private.?key/i.test(key);
  }

  private hasConfiguredValue(value: unknown): boolean {
    if (typeof value === "boolean") return value;
    return value !== null && value !== undefined && value !== "" && value !== false;
  }

  private humanize(value: string): string {
    const spaced = value
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/[_-]+/g, " ")
      .trim();
    return spaced ? spaced.charAt(0).toUpperCase() + spaced.slice(1) : "Unknown";
  }
}
