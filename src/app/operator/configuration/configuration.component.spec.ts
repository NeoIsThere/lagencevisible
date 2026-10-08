import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ConfigurationComponent } from './configuration.component';

describe('Configuration', () => {
  beforeEach(async () => { await TestBed.configureTestingModule({ imports: [ConfigurationComponent], providers: [provideHttpClient(), provideHttpClientTesting()] }).compileComponents(); });
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('saves the three settings and converts displayed hours into minutes', async () => {
    const component = TestBed.createComponent(ConfigurationComponent).componentInstance;
    component.maxLeads = 3; component.maxDurationHours = 1.5; component.maxApiCostUsd = 1.25;
    const saving = component.save();
    const request = TestBed.inject(HttpTestingController).expectOne('/api/config');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ maxLeads: 3, maxDurationMinutes: 90, maxApiCostUsd: 1.25 });
    request.flush({ settings: request.request.body, environment: {} }); await saving;
    expect(component.notice()).toContain('new campaigns');
  });

  it('rejects fractional leads and never submits invalid limits', async () => {
    const component = TestBed.createComponent(ConfigurationComponent).componentInstance;
    component.maxLeads = 2.5;
    await component.save();
    TestBed.inject(HttpTestingController).expectNone('/api/config');
    expect(component.error()).toContain('whole number');
  });

  it('loads the saved API budget with a valid one-minute campaign duration', async () => {
    const component = TestBed.createComponent(ConfigurationComponent).componentInstance;
    const loading = component.load();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne('/api/config').flush({ settings: { maxLeads: 5, maxDurationMinutes: 1, maxApiCostUsd: .29 }, environment: {} });
    http.expectOne('/api/connections').flush([]);
    await loading;
    expect(component.maxApiCostUsd).toBe(.29);
    const saving = component.save();
    const request = http.expectOne('/api/config');
    expect(request.request.body).toEqual({ maxLeads: 5, maxDurationMinutes: 1, maxApiCostUsd: .29 });
    request.flush({ settings: request.request.body, environment: {} });
    await saving;
  });

  it('rejects invalid API budgets before making a request', async () => {
    const component = TestBed.createComponent(ConfigurationComponent).componentInstance;
    for (const budget of [0, -1, .001, 1.005, 10000.01, NaN]) {
      component.maxApiCostUsd = budget;
      await component.save();
      expect(component.error()).toContain('API budget');
    }
    TestBed.inject(HttpTestingController).expectNone('/api/config');
  });
});
