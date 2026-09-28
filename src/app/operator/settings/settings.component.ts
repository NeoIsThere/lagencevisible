import { HttpErrorResponse } from "@angular/common/http";
import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { BehaviorSubject, catchError, map, merge, Observable, of, retry, Subject, switchMap, tap, timer } from "rxjs";
import { ApiService } from "../api.service";
import type {
  ActiveStrategyMode,
  ScheduledSearchFinding,
  ScheduledSearchDetail,
  ScheduledSearchListResponse,
  ScheduleSearchResponse,
  ScheduledSearchStatus,
  ScheduledSearchSummary,
  ScheduledSubsearchDetail,
  ScheduledSubsearchStatus,
  ScheduledSubsearchSummary,
  StrategyCatalog,
} from "../models";

interface ScheduleListPollResult {
  snapshot: ScheduledSearchListResponse | null;
  epoch: number;
  error: string | null;
}

interface ScheduleDetailPollResult {
  id: number | null;
  detail: ScheduledSearchDetail | null;
  error: string | null;
}

interface SubsearchRequest {
  campaignId: number;
  subsearchId: number;
}

interface SubsearchDetailPollResult {
  request: SubsearchRequest | null;
  detail: ScheduledSubsearchDetail | null;
  error: string | null;
}

@Component({
  selector: "app-settings",
  templateUrl: "./settings.component.html",
  styleUrl: "./settings.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent {
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly scheduleRefresh = new Subject<void>();
  private readonly selectedScheduleRequests = new BehaviorSubject<number | null>(null);
  private readonly selectedSubsearchRequests = new BehaviorSubject<SubsearchRequest | null>(null);

  readonly strategyCatalog = signal<StrategyCatalog | null>(null);
  readonly schedules = signal<ScheduledSearchSummary[]>([]);
  readonly queuedCount = signal(0);
  readonly selectedScheduleId = signal<number | null>(null);
  readonly selectedDetail = signal<ScheduledSearchDetail | null>(null);
  readonly selectedSubsearchId = signal<number | null>(null);
  readonly selectedSubsearchDetail = signal<ScheduledSubsearchDetail | null>(null);
  readonly subsearchPinned = signal(false);
  readonly selectedClusterId = signal<string | null>(null);
  readonly searchMode = signal<ActiveStrategyMode>("POOR_WEBSITE");
  readonly continueUntilValidatedLead = signal(false);
  readonly composerOpen = signal(true);
  readonly scheduling = signal(false);
  readonly mutatingScheduleId = signal<number | null>(null);
  readonly loadingSchedules = signal(true);
  readonly loadingDetail = signal(false);
  readonly loadingSubsearch = signal(false);
  readonly catalogError = signal<string | null>(null);
  readonly scheduleError = signal<string | null>(null);
  readonly detailError = signal<string | null>(null);
  readonly subsearchError = signal<string | null>(null);
  readonly scheduleMessage = signal<string | null>(null);
  readonly businessFilter = signal<"all" | "not_selected" | "selected" | "pending">("all");
  readonly businessSearch = signal("");
  readonly campaignGroups = computed(() => {
    const items = this.orderedSchedules();
    const current = items.filter((item) => ["RUNNING", "WAITING"].includes(item.status));
    return [
      { id: "current", label: current.length > 1 ? "Current campaigns" : "Current campaign", items: current },
      { id: "scheduled", label: "Scheduled and paused campaigns", items: items.filter((item) => ["QUEUED", "PAUSED"].includes(item.status)) },
      { id: "past", label: "Past campaigns", items: items.filter((item) => !["RUNNING", "WAITING", "QUEUED", "PAUSED"].includes(item.status))
        .sort((a, b) => b.id - a.id) },
    ];
  });

  private composerInitialized = false;
  private scheduleMutationEpoch = 0;

  constructor() {
    this.api.strategyCatalog()
      .pipe(
        tap({
          error: () => this.catalogError.set("Locations are temporarily unavailable. The page will keep trying."),
        }),
        retry({ delay: 10_000 }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (catalog) => {
          this.strategyCatalog.set(catalog);
          this.catalogError.set(null);
        },
      });

    merge(timer(0, 3_000), this.scheduleRefresh).pipe(
      switchMap(() => {
        const epoch = this.scheduleMutationEpoch;
        return this.api.strategySchedules().pipe(
          map((snapshot): ScheduleListPollResult => ({ snapshot, epoch, error: null })),
          catchError((error: HttpErrorResponse) => of<ScheduleListPollResult>({
            snapshot: null,
            epoch,
            error: this.apiErrorMessage(error, "Campaigns are temporarily unavailable."),
          })),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(({ snapshot, epoch, error }) => {
      if (epoch !== this.scheduleMutationEpoch) return;
      this.loadingSchedules.set(false);
      if (!snapshot) {
        this.scheduleError.set(error);
        return;
      }
      this.applyScheduleSnapshot(snapshot);
    });

    this.selectedScheduleRequests.pipe(
      switchMap((id) => {
        if (id === null) {
          return of<ScheduleDetailPollResult>({ id: null, detail: null, error: null });
        }
        return timer(0, 3_000).pipe(
          switchMap(() => this.api.strategySchedule(id).pipe(
            map((detail): ScheduleDetailPollResult => ({ id, detail, error: null })),
            catchError((error: HttpErrorResponse) => of<ScheduleDetailPollResult>({
              id,
              detail: null,
              error: this.apiErrorMessage(error, "Campaign details are temporarily unavailable."),
            })),
          )),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(({ id, detail, error }) => {
      if (id !== this.selectedScheduleId()) return;
      this.loadingDetail.set(false);
      if (detail) {
        this.selectedDetail.set(detail);
        this.detailError.set(null);
        this.reconcileSubsearchSelection(detail);
        return;
      }
      if (id === null) this.selectedDetail.set(null);
      this.detailError.set(error);
    });

    this.selectedSubsearchRequests.pipe(
      switchMap((request) => {
        if (request === null) {
          return of<SubsearchDetailPollResult>({ request: null, detail: null, error: null });
        }
        return timer(0, 3_000).pipe(
          switchMap(() => this.api.strategyScheduleSubsearch(request.campaignId, request.subsearchId).pipe(
            map((detail): SubsearchDetailPollResult => ({ request, detail, error: null })),
            catchError((error: HttpErrorResponse) => of<SubsearchDetailPollResult>({
              request,
              detail: null,
              error: this.apiErrorMessage(error, "Subsearch details are temporarily unavailable."),
            })),
          )),
        );
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(({ request, detail, error }) => {
      if (request === null) {
        this.selectedSubsearchDetail.set(null);
        this.loadingSubsearch.set(false);
        this.subsearchError.set(null);
        return;
      }
      if (request.campaignId !== this.selectedScheduleId() || request.subsearchId !== this.selectedSubsearchId()) return;
      this.loadingSubsearch.set(false);
      if (detail) {
        this.selectedSubsearchDetail.set(detail);
        this.subsearchError.set(null);
        return;
      }
      this.subsearchError.set(error);
    });
  }

  openComposer(): void {
    this.composerOpen.set(true);
    this.scheduleError.set(null);
    this.scheduleMessage.set(null);
  }

  selectLocation(clusterId: string): void {
    if (this.scheduling()) return;
    const knownLocation = this.strategyCatalog()?.clusters.some((cluster) => cluster.id === clusterId);
    this.selectedClusterId.set(knownLocation ? clusterId : null);
    this.clearSubmissionFeedback();
  }

  setContinueUntilValidatedLead(value: boolean): void {
    if (this.scheduling()) return;
    this.continueUntilValidatedLead.set(value);
    this.clearSubmissionFeedback();
  }

  canSchedule(): boolean {
    return !this.scheduling()
      && this.selectedClusterId() !== null;
  }

  scheduleSearch(): void {
    const mode = this.searchMode();
    const clusterId = this.selectedClusterId();
    const shouldContinue = this.continueUntilValidatedLead();
    if (!clusterId || this.scheduling()) return;

    const mutationEpoch = ++this.scheduleMutationEpoch;
    this.scheduling.set(true);
    this.clearSubmissionFeedback();
    this.api.scheduleStrategySearch({ mode, clusterId, continueUntilValidatedLead: shouldContinue })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ item }) => {
          if (mutationEpoch !== this.scheduleMutationEpoch) return;
          this.scheduleMutationEpoch += 1;
          const alreadyListed = this.schedules().some((candidate) => candidate.id === item.id);
          this.schedules.update((items) => [item, ...items.filter((candidate) => candidate.id !== item.id)]);
          this.queuedCount.update((count) => item.status === "QUEUED" && !alreadyListed ? count + 1 : count);
          this.selectedClusterId.set(null);
          this.continueUntilValidatedLead.set(false);
          this.composerOpen.set(false);
          this.scheduling.set(false);
          this.setSelectedSchedule(item.id);
          this.scheduleMessage.set(`Campaign #${item.id} in ${item.locationLabel} was scheduled.`);
          this.scheduleRefresh.next();
        },
        error: (error: HttpErrorResponse) => {
          if (mutationEpoch !== this.scheduleMutationEpoch) return;
          this.scheduleMutationEpoch += 1;
          this.scheduleError.set(this.apiErrorMessage(error, "The campaign could not be scheduled."));
          this.scheduling.set(false);
          this.scheduleRefresh.next();
        },
      });
  }

  pauseSchedule(id: number): void {
    this.mutateSchedule(id, "paused", this.api.pauseStrategySchedule(id));
  }

  resumeSchedule(id: number): void {
    this.mutateSchedule(id, "resumed", this.api.resumeStrategySchedule(id));
  }

  cancelSchedule(id: number): void {
    this.mutateSchedule(id, "cancelled", this.api.cancelStrategySchedule(id));
  }

  selectSchedule(id: number): void {
    this.setSelectedSchedule(id, true);
  }

  selectSubsearch(id: number): void {
    const detail = this.selectedDetail();
    if (!detail || !detail.subsearches.some((candidate) => candidate.id === id)) return;
    this.subsearchPinned.set(true);
    const inlineDetail = detail.currentSubsearchDetail?.subsearch.id === id
      ? detail.currentSubsearchDetail
      : null;
    this.setSelectedSubsearch(detail.search.id, id, inlineDetail, true);
  }

  followCurrentSubsearch(): void {
    const detail = this.selectedDetail();
    const current = detail?.search.currentSubsearch;
    if (!detail || !current) return;
    this.subsearchPinned.set(false);
    const inlineDetail = detail.currentSubsearchDetail?.subsearch.id === current.id
      ? detail.currentSubsearchDetail
      : null;
    this.setSelectedSubsearch(detail.search.id, current.id, inlineDetail, true);
  }

  orderedSchedules(): ScheduledSearchSummary[] {
    const statusOrder: Record<ScheduledSearchStatus, number> = {
      RUNNING: 0,
      WAITING: 1,
      QUEUED: 2,
      PAUSED: 3,
      BLOCKED: 4,
      FAILED: 5,
      EXHAUSTED: 6,
      COMPLETED: 7,
      CANCELLED: 8,
    };
    return [...this.schedules()].sort((left, right) => {
      const byStatus = statusOrder[left.status] - statusOrder[right.status];
      if (byStatus !== 0) return byStatus;
      if (left.status === "QUEUED" && right.status === "QUEUED") {
        return (left.queuePosition ?? Number.MAX_SAFE_INTEGER) - (right.queuePosition ?? Number.MAX_SAFE_INTEGER);
      }
      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    });
  }

  orderedSubsearches(detail = this.selectedDetail()): ScheduledSubsearchSummary[] {
    if (!detail) return [];
    return [...detail.subsearches].sort((left, right) => {
      const createdDifference = new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
      return createdDifference || left.id - right.id;
    });
  }

  isSelected(id: number): boolean {
    return this.selectedScheduleId() === id;
  }

  isSelectedSubsearch(id: number): boolean {
    return this.selectedSubsearchId() === id;
  }

  isCurrentSubsearch(id: number): boolean {
    return this.selectedDetail()?.search.currentSubsearch?.id === id;
  }

  selectedSubsearch(): ScheduledSubsearchSummary | null {
    const id = this.selectedSubsearchId();
    if (id === null) return null;
    return this.selectedDetail()?.subsearches.find((candidate) => candidate.id === id) ?? null;
  }

  activeSubsearchDetail(): ScheduledSubsearchDetail | null {
    const detail = this.selectedSubsearchDetail();
    return detail?.subsearch.id === this.selectedSubsearchId() ? detail : null;
  }

  displayedSubsearch(): ScheduledSubsearchSummary | null {
    return this.activeSubsearchDetail()?.subsearch ?? this.selectedSubsearch();
  }

  subsearchNumber(id: number): number {
    const index = this.orderedSubsearches().findIndex((candidate) => candidate.id === id);
    return index < 0 ? 0 : index + 1;
  }

  statusLabel(status: ScheduledSearchStatus | ScheduledSubsearchStatus): string {
    switch (status) {
      case "QUEUED": return "Waiting";
      case "PENDING": return "Preparing";
      case "RUNNING": return "Running";
      case "WAITING": return "Waiting";
      case "PAUSED": return "Paused";
      case "EXHAUSTED": return "Limit reached";
      case "COMPLETED": return "Completed";
      case "FAILED": return "Failed";
      case "BLOCKED": return "Blocked";
      case "CANCELLED": return "Cancelled";
    }
  }

  waitingReasonLabel(reason: string | null): string {
    if (!reason) return "Waiting for an eligible subsearch";
    if (reason === "ready_queue_target") return "The target number of businesses awaiting review has been reached";
    if (reason === "ready_queue_hard_limit") return "The maximum number of businesses awaiting review has been reached";
    if (reason.includes("daily_cap")) return "Daily subsearch diversity limit reached";
    if (reason.includes("cooldown") || reason.includes("next_eligible")) return "Waiting before these subsearches can be repeated";
    if (reason.includes("budget")) return "Waiting for budget availability";
    return reason.replaceAll("_", " ");
  }

  findingOutcomeLabel(outcome: ScheduledSearchFinding["outcome"]): string {
    switch (outcome) {
      case "evaluating": return "Evaluating";
      case "queued": return "Waiting";
      case "candidate": return "Selected";
      case "qualified": return "Waiting for email";
      case "needs_research": return "Not selected · needs attention";
      case "excluded": return "Not selected";
      case "duplicate": return "Already known";
    }
  }

  failureCodeLabel(code: string): string {
    const known: Record<string, string> = {
      MISSING_EMAIL: "No validated email",
      MISSING_WEBSITE: "Website not verified",
      SPARSE_EVIDENCE: "Not enough evidence",
      PROVIDER_TRANSIENT: "Provider unavailable",
      WEBSITE_VERIFICATION_FAILED: "Website mismatch",
      SCREENSHOT_CAPTURE_FAILED: "Screenshot retry needed",
      QUALIFICATION_REJECTED: "Qualification gates not met",
      RECIPIENT_COLLISION: "Recipient already in pipeline",
      SUPPRESSED: "Suppressed recipient",
      PROCESSING_FAILURE: "Processing failed",
      EXCLUDED: "Discovery exclusion",
      RETRYABLE: "Evidence retry needed",
      UNRESOLVED: "Still resolving",
    };
    return known[code] ?? code.replaceAll("_", " ").toLocaleLowerCase("en");
  }

  formatTime(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
  }

  formatCost(value: number): string {
    return new Intl.NumberFormat("en-IE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }

  private applyScheduleSnapshot(snapshot: ScheduledSearchListResponse): void {
    this.schedules.set(snapshot.items);
    this.queuedCount.set(snapshot.queuedCount);
    this.scheduleError.set(null);
    if (!this.composerInitialized) {
      this.composerOpen.set(snapshot.items.length === 0);
      this.composerInitialized = true;
    }
    this.reconcileSelection(snapshot.items);
    if (this.selectedScheduleId() === null && snapshot.items.length) {
      this.setSelectedSchedule(snapshot.currentId ?? this.orderedSchedules()[0]!.id);
    }
  }

  private mutateSchedule(
    id: number,
    action: "paused" | "resumed" | "cancelled",
    request: Observable<ScheduleSearchResponse>,
  ): void {
    if (this.mutatingScheduleId() !== null) return;
    const mutationEpoch = ++this.scheduleMutationEpoch;
    this.mutatingScheduleId.set(id);
    this.clearSubmissionFeedback();
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ item }) => {
        if (mutationEpoch !== this.scheduleMutationEpoch) return;
        this.scheduleMutationEpoch += 1;
        this.schedules.update((items) => items.map((candidate) => candidate.id === id ? item : candidate));
        this.selectedDetail.update((detail) => detail?.search.id === id ? { ...detail, search: item } : detail);
        this.scheduleMessage.set(`Campaign ${action}.`);
        this.mutatingScheduleId.set(null);
        this.scheduleRefresh.next();
      },
      error: (error: HttpErrorResponse) => {
        if (mutationEpoch !== this.scheduleMutationEpoch) return;
        this.scheduleMutationEpoch += 1;
        this.scheduleError.set(this.apiErrorMessage(error, `The campaign could not be ${action}.`));
        this.mutatingScheduleId.set(null);
        this.scheduleRefresh.next();
      },
    });
  }

  private reconcileSelection(items: ScheduledSearchSummary[]): void {
    const selectedId = this.selectedScheduleId();
    if (selectedId === null) return;
    if (items.some((item) => item.id === selectedId)) return;
    this.setSelectedSchedule(null);
  }

  private reconcileSubsearchSelection(detail: ScheduledSearchDetail): void {
    const selectedId = this.selectedSubsearchId();
    const selectedStillExists = selectedId !== null
      && detail.subsearches.some((candidate) => candidate.id === selectedId);
    if (this.subsearchPinned() && selectedStillExists) return;
    if (this.subsearchPinned() && !selectedStillExists) this.subsearchPinned.set(false);

    const ordered = this.orderedSubsearches(detail);
    const preferred = detail.search.currentSubsearch ?? ordered.at(-1) ?? null;
    const inlineDetail = preferred && detail.currentSubsearchDetail?.subsearch.id === preferred.id
      ? detail.currentSubsearchDetail
      : null;
    this.setSelectedSubsearch(detail.search.id, preferred?.id ?? null, inlineDetail);
  }

  private setSelectedSchedule(id: number | null, refreshWhenUnchanged = false): void {
    const changed = this.selectedScheduleId() !== id;
    if (changed) {
      this.selectedScheduleId.set(id);
      this.selectedDetail.set(null);
      this.detailError.set(null);
      this.loadingDetail.set(id !== null);
      this.subsearchPinned.set(false);
      this.setSelectedSubsearch(id, null);
    }
    if (changed || refreshWhenUnchanged) this.selectedScheduleRequests.next(id);
  }

  private setSelectedSubsearch(
    campaignId: number | null,
    subsearchId: number | null,
    inlineDetail: ScheduledSubsearchDetail | null = null,
    refreshWhenUnchanged = false,
  ): void {
    const changed = this.selectedSubsearchId() !== subsearchId;
    if (changed) {
      this.selectedSubsearchId.set(subsearchId);
      this.businessFilter.set("all");
      this.businessSearch.set("");
      this.selectedSubsearchDetail.set(inlineDetail);
      this.subsearchError.set(null);
      this.loadingSubsearch.set(subsearchId !== null && inlineDetail === null);
    } else if (inlineDetail) {
      this.selectedSubsearchDetail.set(inlineDetail);
      this.loadingSubsearch.set(false);
    }

    if (!changed && !refreshWhenUnchanged) return;
    const request = campaignId !== null && subsearchId !== null
      ? { campaignId, subsearchId }
      : null;
    this.selectedSubsearchRequests.next(request);
  }

  private clearSubmissionFeedback(): void {
    this.scheduleError.set(null);
    this.scheduleMessage.set(null);
  }

  businessSelection(business: ScheduledSearchFinding): "selected" | "not_selected" | "pending" {
    if (business.selection) return business.selection;
    if (business.outcome === "candidate") return "selected";
    if (["excluded", "duplicate", "needs_research"].includes(business.outcome)) return "not_selected";
    return "pending";
  }

  businessCount(selection: "selected" | "not_selected" | "pending"): number {
    return this.activeSubsearchDetail()?.findings.filter((business) => this.businessSelection(business) === selection).length ?? 0;
  }

  businessesFound(): number {
    const detail = this.activeSubsearchDetail();
    return Math.max(detail?.progress?.resultsFound ?? 0, this.displayedSubsearch()?.rawResultCount ?? 0, detail?.findings.length ?? 0);
  }

  visibleBusinesses(): ScheduledSearchFinding[] {
    const query = this.businessSearch().trim().toLocaleLowerCase();
    return (this.activeSubsearchDetail()?.findings ?? []).filter((business) =>
      (this.businessFilter() === "all" || this.businessSelection(business) === this.businessFilter())
      && (!query || `${business.businessName} ${business.city} ${business.reason ?? ""}`.toLocaleLowerCase().includes(query)),
    );
  }

  businessReason(business: ScheduledSearchFinding): string {
    if (business.reason?.trim()) return this.businessText(business.reason);
    if (business.failureCode) return this.businessText(this.failureCodeLabel(business.failureCode));
    if (this.businessSelection(business) === "selected") return "This business passed evaluation and its email is ready for review.";
    if (this.businessSelection(business) === "pending") return "This business is still being processed. A selection decision has not been made.";
    return "The reason was not recorded for this business in this subsearch.";
  }

  businessText(value: string): string {
    return value.replace(/\b(?:leads|prospects|candidates)\b/gi, "businesses")
      .replace(/\b(?:lead|prospect|candidate)\b/gi, "business")
      .replace(/\bsub-searches\b/gi, "subsearches").replace(/\bsub-search\b/gi, "subsearch")
      .replace(/\bqueries\b/gi, "subsearches").replace(/\bquery\b/gi, "subsearch")
      .replace(/\bsearches\b/gi, "subsearches").replace(/\bsearch\b/gi, "subsearch");
  }

  stageLabel(stage: string): string {
    return ({ discovery: "Find businesses", enrichment: "Website and contact", analysis: "Evaluate offer", drafting: "Prepare email", complete: "Complete" } as Record<string, string>)[stage] ?? "Prepare subsearch";
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
