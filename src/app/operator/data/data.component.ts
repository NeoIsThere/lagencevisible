import { HttpErrorResponse } from "@angular/common/http";
import { DatePipe } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, signal } from "@angular/core";
import { ApiService } from "../api.service";
import type {
  StrategyDataSnapshot,
  StrategyEvidenceStage,
  StrategyLearningAggregate,
  StrategyMode,
} from "../models";

interface DisplayEntry {
  label: string;
  value: string;
}

interface DisplaySection {
  label: string;
  entries: DisplayEntry[];
}

@Component({
  selector: "app-data",
  imports: [DatePipe],
  templateUrl: "./data.component.html",
  styleUrl: "./data.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataComponent {
  private readonly api = inject(ApiService);

  readonly snapshot = signal<StrategyDataSnapshot | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly view = signal<"observed" | "assumptions">("observed");

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.strategyData().subscribe({
      next: (snapshot) => {
        this.snapshot.set(snapshot);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(error.error?.error || error.message || "The data snapshot could not be loaded.");
        this.loading.set(false);
      },
    });
  }

  setView(view: "observed" | "assumptions"): void {
    this.view.set(view);
  }

  modeLabel(mode: StrategyMode): string {
    return mode === "NO_WEBSITE" ? "Legacy campaign" : "Website rescue";
  }

  number(value: number): string {
    return new Intl.NumberFormat("en-US").format(value);
  }

  percent(value: number | null): string {
    return value === null
      ? "Not measured"
      : new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 1 }).format(value);
  }

  euro(value: number | null): string {
    return value === null
      ? "Not measured"
      : new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "EUR",
          minimumFractionDigits: value >= 10 ? 2 : 4,
          maximumFractionDigits: value >= 10 ? 2 : 4,
        }).format(value);
  }

  evidenceTitle(stage: StrategyEvidenceStage): string {
    return ({
      NONE: "No observed evidence yet",
      DISCOVERY_ONLY: "Discovery evidence only",
      QUALIFICATION: "Qualification evidence available",
      DELIVERY: "Delivery evidence available",
      SALES: "Sales evidence available",
    })[stage];
  }

  evidenceExplanation(stage: StrategyEvidenceStage): string {
    return ({
      NONE: "The engine is currently guided entirely by configured assumptions and priors.",
      DISCOVERY_ONLY: "The engine has observed search results, but qualification and commercial ranking are still assumption-led.",
      QUALIFICATION: "The engine has observed which discovered businesses qualify; delivery and sales rates may still rely on priors.",
      DELIVERY: "Search, qualification, and email delivery evidence are available. Sales outcomes remain limited until recorded.",
      SALES: "Recorded outcomes now cover discovery through sales. Sparse groups can still remain assumption-led.",
    })[stage];
  }

  testedLabel(aggregate: StrategyLearningAggregate): string {
    return aggregate.testedPairs === 0
      ? "Not tested"
      : `${aggregate.testedPairs} of ${aggregate.configuredPairs} pairs tested`;
  }

  ruleEntries(rules: Record<string, boolean | number>): DisplayEntry[] {
    return Object.entries(rules).map(([key, value]) => ({
      label: this.humanize(key),
      value: typeof value === "boolean" ? (value ? "Yes" : "No") : String(value),
    }));
  }

  learningSections(value: Record<string, unknown>): DisplaySection[] {
    return Object.entries(value).map(([key, section]) => ({
      label: this.humanize(key),
      entries: this.flatten(section),
    }));
  }

  private flatten(value: unknown, prefix = ""): DisplayEntry[] {
    if (value === null || typeof value !== "object") {
      return [{ label: prefix || "Value", value: this.displayValue(value) }];
    }
    if (Array.isArray(value)) {
      return [{ label: prefix || "Values", value: value.map((item) => this.displayValue(item)).join(", ") }];
    }
    return Object.entries(value).flatMap(([key, nested]) => {
      const label = prefix ? `${prefix} / ${this.humanize(key)}` : this.humanize(key);
      return nested !== null && typeof nested === "object" && !Array.isArray(nested)
        ? this.flatten(nested, label)
        : [{ label, value: this.displayValue(nested) }];
    });
  }

  private displayValue(value: unknown): string {
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (value === null || value === undefined) return "None";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  }

  private humanize(value: string): string {
    const words = value
      .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
      .replace(/[_-]+/g, " ")
      .toLocaleLowerCase("en");
    return words.charAt(0).toLocaleUpperCase("en") + words.slice(1);
  }
}
