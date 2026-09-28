import { TestBed, type ComponentFixture } from "@angular/core/testing";
import { of } from "rxjs";
import { ApiService } from "../api.service";
import { SettingsComponent } from "./settings.component";
import { campaignDetailFixture, campaignFixture, subsearchDetailFixture } from "./settings.fixtures";

describe("Campaign navigation and business decisions", () => {
  let fixture: ComponentFixture<SettingsComponent>;
  const snapshot = () => ({ items: [campaignFixture(12, "RUNNING"), campaignFixture(13, "QUEUED"), campaignFixture(11)], queuedCount: 1, outstandingCount: 2, currentId: 12 });
  beforeEach(async () => {
    vi.useFakeTimers();
    await TestBed.configureTestingModule({ imports: [SettingsComponent], providers: [{ provide: ApiService, useValue: {
      strategyCatalog: () => of({ strategyVersion: 4, checksum: "test", modes: [], clusters: [] }),
      strategySchedules: () => of(snapshot()), strategySchedule: (id: number) => of(campaignDetailFixture(id)),
      strategyScheduleSubsearch: (_id: number, subsearchId: number) => of(subsearchDetailFixture(subsearchId)),
    } }] }).compileComponents();
    fixture = TestBed.createComponent(SettingsComponent);
    fixture.detectChanges();
    await vi.advanceTimersByTimeAsync(5);
    fixture.detectChanges();
  });
  afterEach(() => { fixture.destroy(); vi.useRealTimers(); });
  function element(): HTMLElement { return fixture.nativeElement as HTMLElement; }
  async function click(selector: string, text: string): Promise<void> {
    const button = [...element().querySelectorAll<HTMLButtonElement>(selector)].find((item) => item.textContent?.includes(text));
    expect(button, `Missing button ${text}`).toBeTruthy();
    button!.click();
    await vi.advanceTimersByTimeAsync(5);
    fixture.detectChanges();
  }

  it("separates current, scheduled and past campaigns and opens the current subsearch", () => {
    expect(element().querySelector('[aria-labelledby="campaign-group-current"]')?.textContent).toContain("Campaign #12");
    expect(element().querySelector('[aria-labelledby="campaign-group-past"]')?.textContent).toContain("Campaign #11");
    expect(element().querySelector('[aria-labelledby="campaign-group-past"]')?.textContent).not.toContain("Campaign #12");
    expect(fixture.componentInstance.selectedSubsearchId()).toBe(122);
    expect(element().textContent).toContain("Current subsearch");
    expect(element().querySelector('.business-stats')?.textContent).toContain("Businesses found");
  });

  it("shows reasons from discovery, enrichment, analysis and duplication", () => {
    const text = element().querySelector('.business-list')?.textContent ?? "";
    expect(text).toContain("subsearch business limit was reached");
    expect(text).toContain("No public email");
    expect(text).toContain("did not support a contained");
    expect(text).toContain("already known");
    expect(text).not.toMatch(/\b(candidate|prospect|lead|query)\b/i);
  });

  it("filters businesses without counting an unfinished business as rejected", async () => {
    expect(fixture.componentInstance.businessCount("pending")).toBe(1);
    await click('.business-filters button', 'Not selected');
    expect(element().querySelectorAll('.business-card')).toHaveLength(4);
    expect(element().querySelector('.business-list')?.textContent).not.toContain("Azur Piscines");
    await click('.business-filters button', 'Selected');
    expect(element().querySelectorAll('.business-card')).toHaveLength(1);
    expect(element().querySelector('.business-list')?.textContent).toContain("Riviera Piscines");
  });

  it("keeps an explicitly chosen past subsearch selected across automatic refreshes", async () => {
    await click('.subsearch-item', 'Subsearch 1');
    expect(fixture.componentInstance.selectedSubsearchId()).toBe(121);
    await vi.advanceTimersByTimeAsync(3_100);
    fixture.detectChanges();
    expect(fixture.componentInstance.selectedSubsearchId()).toBe(121);
    await click('.text-button', 'View current subsearch');
    expect(fixture.componentInstance.selectedSubsearchId()).toBe(122);
  });

  it("opens all subsearches in a past campaign without retaining the current business details", async () => {
    await click('.campaign-item', 'Campaign #11');
    expect(fixture.componentInstance.selectedScheduleId()).toBe(11);
    expect(fixture.componentInstance.selectedSubsearchId()).toBe(112);
    expect(element().querySelector('.active-work')).toBeNull();
    await click('.subsearch-item', 'Subsearch 1');
    expect(fixture.componentInstance.selectedSubsearchId()).toBe(111);
    expect(element().querySelector('.business-panel')?.textContent).toContain('Campaign #11 / Subsearch 1');
  });
});
