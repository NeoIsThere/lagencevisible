import { TestBed, type ComponentFixture } from "@angular/core/testing";
import { provideRouter } from "@angular/router";
import { of } from "rxjs";
import { ApiService } from "../api.service";
import type { Lead } from "../models";
import { DashboardComponent } from "./dashboard.component";

describe("Candidate email placeholders", () => {
  let fixture: ComponentFixture<DashboardComponent>;
  const send = vi.fn(() => of({}));
  const reject = vi.fn(() => of({}));
  const business = (email: Lead["email"]): Lead => ({
    id: "business", businessName: "Workshop", city: "Nice",
    mapsUrl: null, websiteUrl: null, contactEmail: "contact@example.test", contactEmailSourceUrl: null,
    contactName: null, audit: null, screenshotUrl: null,
    scores: { final: 90, abilityToPay: 80, websiteNeed: 90, contactability: 80 },
    qualificationReason: "A clear redesign opportunity.", websiteCondition: null,
    communicationLanguage: "en", languageReason: "Test business", websiteProblems: [],
    commercialEstimate: null, deliveryApproach: null, aiArtifacts: [], email, status: "ready",
    failureCode: null, retryAfter: null, evidenceRefreshedAt: null, attemptGeneration: 1,
    createdAt: "2026-09-29T10:00:00Z", sentAt: null, rejectedAt: null, suppressedAt: null,
  });

  beforeEach(async () => {
    vi.useFakeTimers();
    send.mockClear(); reject.mockClear();
    await TestBed.configureTestingModule({ imports: [DashboardComponent], providers: [provideRouter([]),
      { provide: ApiService, useValue: { send, reject, reviewQueue: () => of({ leads: [], total: 0 }) } },
    ] }).compileComponents();
    fixture = TestBed.createComponent(DashboardComponent);
    fixture.componentInstance.loading.set(false);
  });
  afterEach(() => { fixture.destroy(); vi.useRealTimers(); });

  it("renders the placeholder literally, blocks sending and retains rejection", () => {
    const current = business({ subject: "<email goes here>", body: "<email goes here>", isPlaceholder: true });
    fixture.componentInstance.leads.set([current]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector(".email-card").textContent).toContain("<email goes here>");
    expect(fixture.nativeElement.querySelector(".email-card email")).toBeNull();
    expect(fixture.nativeElement.querySelector(".send").disabled).toBe(true);
    fixture.componentInstance.act(current, "send");
    expect(send).not.toHaveBeenCalled();
    fixture.componentInstance.act(current, "reject");
    expect(reject).toHaveBeenCalledWith("business");
  });

  it("keeps real drafts sendable and recognizes placeholders without the API flag", () => {
    expect(fixture.componentInstance.emailIsPlaceholder(business({ subject: "Hello", body: "<email goes here>" }))).toBe(true);
    const current = business({ subject: "Your website", body: "A completed email draft." });
    fixture.componentInstance.leads.set([current]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector(".send").disabled).toBe(false);
    fixture.componentInstance.act(current, "send");
    expect(send).toHaveBeenCalledWith("business");
  });
});
