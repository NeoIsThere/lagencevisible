import { HttpErrorResponse } from "@angular/common/http";
import { DatePipe } from "@angular/common";
import { ChangeDetectionStrategy, Component, inject, signal } from "@angular/core";
import { RouterLink, RouterLinkActive } from "@angular/router";
import { ApiService } from "../api.service";
import type { ManualResearchContactPoint, ManualResearchLead } from "../models";

@Component({
  selector: "app-research",
  imports: [DatePipe, RouterLink, RouterLinkActive],
  templateUrl: "./research.component.html",
  styleUrl: "./research.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResearchComponent {
  private readonly api = inject(ApiService);

  readonly leads = signal<ManualResearchLead[]>([]);
  readonly total = signal(0);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly retrying = signal<string | null>(null);
  readonly actionError = signal<{ id: string; message: string } | null>(null);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.manualResearch().subscribe({
      next: ({ leads, total }) => {
        this.leads.set(leads);
        this.total.set(total);
        this.loading.set(false);
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(error.error?.error || error.message || "Candidates needing attention could not be loaded.");
        this.loading.set(false);
      },
    });
  }

  retry(lead: ManualResearchLead): void {
    if (this.retrying()) return;
    this.retrying.set(lead.id);
    this.actionError.set(null);
    this.api.retryCandidateEvidence(lead.id).subscribe({
      next: () => {
        this.retrying.set(null);
        this.load();
      },
      error: (error: HttpErrorResponse) => {
        this.actionError.set({
          id: lead.id,
          message: error.error?.error || error.message || "The evidence refresh could not be queued.",
        });
        this.retrying.set(null);
      },
    });
  }

  reason(code: string | null): string {
    return ({
      MISSING_EMAIL: "No public, attributable email has been verified.",
      MISSING_WEBSITE: "Website presence could not be verified yet.",
      SPARSE_EVIDENCE: "The public evidence is not complete enough for an automatic decision.",
      PROVIDER_TRANSIENT: "A provider or crawler failure interrupted evidence collection.",
      WEBSITE_VERIFICATION_FAILED: "A candidate URL could not be confidently matched to this business.",
      SCREENSHOT_CAPTURE_FAILED: "The automatic screenshot check could not obtain trustworthy visual evidence.",
    } as Record<string, string>)[code ?? ""] ?? "Automatic evidence collection is incomplete.";
  }

  channelLabel(point: ManualResearchContactPoint): string {
    return ({ EMAIL: "Email", PHONE: "Call", CONTACT_FORM: "Contact form", SOCIAL: "Social" })[point.kind];
  }

  channelHref(point: ManualResearchContactPoint): string {
    if (point.kind === "EMAIL") return `mailto:${point.value}`;
    if (point.kind === "PHONE") return `tel:${point.value}`;
    return point.value;
  }

  percent(value: number): string {
    return new Intl.NumberFormat("en-US", { style: "percent", maximumFractionDigits: 0 }).format(value);
  }
}
