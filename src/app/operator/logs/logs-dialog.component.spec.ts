import { TestBed, type ComponentFixture } from "@angular/core/testing";
import { of, Subject, throwError } from "rxjs";
import { ApiService } from "../api.service";
import type { ApplicationLogsResponse } from "../models";
import { LogsDialogComponent } from "./logs-dialog.component";

describe("Application logs dialog", () => {
  let fixture: ComponentFixture<LogsDialogComponent>;
  const response: ApplicationLogsResponse = { entries: [{ id: "12", service: "worker", level: "error", message: "Job 260 (discover) failed DataForSEO HTTP 403 <script>bad()</script>", createdAt: "2026-09-29T10:00:00Z" }], hasMore: false, retentionDays: 7, maxStoredEntries: 20000 };
  const fetchLogs = vi.fn(() => of(response));
  beforeEach(async () => {
    vi.useFakeTimers();
    fetchLogs.mockReset().mockReturnValue(of(response));
    await TestBed.configureTestingModule({ imports: [LogsDialogComponent], providers: [{ provide: ApiService, useValue: { applicationLogs: fetchLogs } }] }).compileComponents();
    fixture = TestBed.createComponent(LogsDialogComponent);
    fixture.detectChanges();
    // jsdom has no native modal/focus implementation; browser QA covers that.
    const dialog = fixture.nativeElement.querySelector("dialog") as HTMLDialogElement;
    dialog.showModal = () => { dialog.open = true; };
    dialog.close = () => { dialog.open = false; dialog.dispatchEvent(new Event("close")); };
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
  });
  afterEach(() => { fixture.destroy(); vi.restoreAllMocks(); vi.useRealTimers(); });
  const open = () => { (fixture.nativeElement.querySelector(".logs-button") as HTMLButtonElement).click(); fixture.detectChanges(); };

  it("loads only when opened, renders messages as text and stops polling on close", async () => {
    expect(fetchLogs).not.toHaveBeenCalled();
    open();
    expect(fixture.nativeElement.querySelector("dialog").open).toBe(true);
    expect(fixture.nativeElement.querySelector("pre").textContent).toContain("HTTP 403 <script>");
    expect(fixture.nativeElement.querySelector("script")).toBeNull();
    await vi.advanceTimersByTimeAsync(5000);
    expect(fetchLogs).toHaveBeenCalledTimes(2);
    fixture.componentInstance.close();
    await vi.advanceTimersByTimeAsync(10000);
    expect(fetchLogs).toHaveBeenCalledTimes(2);
  });

  it("applies service, severity and message filters and supports pausing automatic refresh", async () => {
    open();
    fixture.componentInstance.filter("service", "worker");
    fixture.componentInstance.filter("level", "error");
    fixture.componentInstance.query.set("  DataForSEO  ");
    fixture.componentInstance.search(new Event("submit"));
    expect(fetchLogs).toHaveBeenLastCalledWith({ service: "worker", level: "error", q: "DataForSEO" });
    fixture.componentInstance.live.set(false);
    const calls = fetchLogs.mock.calls.length;
    await vi.advanceTimersByTimeAsync(10000);
    expect(fetchLogs).toHaveBeenCalledTimes(calls);
    fixture.componentInstance.refresh();
    expect(fetchLogs).toHaveBeenCalledTimes(calls + 1);
  });

  it("cancels stale requests when filters change and when the dialog closes", () => {
    const pending = new Subject<ApplicationLogsResponse>();
    fetchLogs.mockReturnValueOnce(pending);
    open();
    fixture.componentInstance.filter("level", "warn");
    expect(pending.observed).toBe(false);
    expect(fixture.componentInstance.result()).toEqual(response);
    fetchLogs.mockReturnValueOnce(pending);
    fixture.componentInstance.refresh();
    fixture.componentInstance.close();
    expect(pending.observed).toBe(false);
  });

  it("shows a useful error and stops polling an expired session", async () => {
    fetchLogs.mockReturnValue(throwError(() => ({ status: 401 })));
    open();
    expect(fixture.nativeElement.textContent).toContain("Your session expired");
    await vi.advanceTimersByTimeAsync(10000);
    expect(fetchLogs).toHaveBeenCalledTimes(1);
  });
});
