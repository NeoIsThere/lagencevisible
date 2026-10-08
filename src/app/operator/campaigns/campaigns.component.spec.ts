import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Campaign, ProcessedBusiness } from '../models';
import { CampaignsComponent } from './campaigns.component';

const campaign: Campaign = {
  id: 'campaign-1', status: 'completed', reasonForCompletion: 'lead_limit', completionDetails: null,
  regionId: 'region-1', regionName: 'Alpes-Maritimes', businessFamily: 'Plombiers', cities: ['Nice', 'Antibes'],
  queries: [], currentCity: null, startedAt: '2026-10-08T08:00:00Z', completedAt: '2026-10-08T08:10:00Z',
  maxLeads: 5, maxDurationMinutes: 180, maxApiCostUsd: 2, leadCount: 1, processedCount: 2, costUsd: 0.006,
};
const screenshotFilename = 'c31349d2-590b-47b4-a74f-66e73252b236-13b315ac-6a3f-4fa1-bdcb-252251e7c544-mobile.png';
const business: ProcessedBusiness = {
  key: 'plomberie-test-nice', name: 'Plomberie Test', city: 'Nice', email: null, phone: '0102030405', website: null,
  status: 'new', evaluationStatus: 'new', reasonForStatus: { code: 'no_website', details: 'No official website found after the verification search. Reviews establish a public business presence.' },
  comments: '', evidence: [{ kind: 'reviews', url: 'https://example.com/business', facts: ['12 reviews'], observedAt: '2026-10-08T08:05:00Z', screenshot: screenshotFilename }],
  evaluatedAt: '2026-10-08T08:06:00Z',
};

describe('Campaigns', () => {
  let http: HttpTestingController;
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CampaignsComponent], providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()] }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('blocks a second campaign while one is running', async () => {
    const fixture = TestBed.createComponent(CampaignsComponent);
    const component = fixture.componentInstance;
    component.campaigns.set([{ ...campaign, status: 'running' }]);
    component.regionId.set('region-1'); component.businessFamily = 'Plombiers';
    await component.start();
    http.expectNone('/api/campaigns');
  });

  it('saves an exact lead status and comments without changing its eligibility evidence', async () => {
    const component = TestBed.createComponent(CampaignsComponent).componentInstance;
    component.businesses.set([business]);
    component.statusDrafts[business.key] = 'paid - not delivered';
    component.commentDrafts[business.key] = 'Contract signed; payment received.';
    const saving = component.saveBusiness(business);
    const request = http.expectOne('/api/businesses/' + business.key);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ status: 'paid - not delivered', comments: 'Contract signed; payment received.' });
    request.flush({ ...business, ...request.request.body });
    await saving;
    expect(component.businesses()[0].reasonForStatus).toEqual(business.reasonForStatus);
    expect(component.businesses()[0].evaluationStatus).toBe('new');
    expect(component.hasChanges(component.businesses()[0])).toBe(false);
  });

  it('never submits a lead status when editing an ineligible business', async () => {
    const component = TestBed.createComponent(CampaignsComponent).componentInstance;
    const ineligible: ProcessedBusiness = { ...business, status: 'not eligible', evaluationStatus: 'not eligible' };
    component.statusDrafts[business.key] = 'new';
    component.commentDrafts[business.key] = 'Reviewed manually.';
    const saving = component.saveBusiness(ineligible);
    const request = http.expectOne('/api/businesses/' + business.key);
    expect(request.request.body).toEqual({ comments: 'Reviewed manually.' });
    request.flush({ ...ineligible, comments: 'Reviewed manually.' });
    await saving;
  });

  it('shows the detailed evidence and exact six statuses for a lead', async () => {
    const fixture = TestBed.createComponent(CampaignsComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    http.expectOne('/api/campaigns').flush([]);
    http.expectOne('/api/regions').flush([]);
    await fixture.whenStable();
    component.selected.set(campaign); component.businesses.set([business]); component.expanded.set(business.key);
    fixture.detectChanges(); await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain(business.reasonForStatus.details);
    expect(root.textContent).toContain('12 reviews');
    expect(root.textContent).toContain('of $2.00 USD budget');
    expect(Array.from(root.querySelectorAll<HTMLSelectElement>('select[name="status"] option')).map(option => option.value)).toEqual(['new', 'contacted', 'signed', 'paid - not delivered', 'not paid - delivered', 'completed']);
    expect(root.querySelector('a[href="https://example.com/business"]')).toBeTruthy();
    expect(root.querySelector('img')?.getAttribute('src')).toBe('/screenshots/' + screenshotFilename);
    component.businesses.set([{ ...business, status: 'not eligible', evaluationStatus: 'not eligible' }]);
    fixture.detectChanges();
    expect(root.querySelector('select[name="status"]')).toBeNull();
  });

  it('preserves a campaign’s ineligible evaluation when PATCH returns the original global lead', async () => {
    const component = TestBed.createComponent(CampaignsComponent).componentInstance;
    const duplicate: ProcessedBusiness = {
      ...business, status: 'not eligible', evaluationStatus: 'not eligible',
      reasonForStatus: { code: 'ALREADY_RETURNED', details: 'This business was returned as a lead by an earlier campaign.' },
      evidence: [{ kind: 'previous_campaign', url: 'https://example.com/history', facts: ['Previously returned lead.'], observedAt: '2026-10-08T09:00:00Z' }],
      evaluatedAt: '2026-10-08T09:00:00Z',
    };
    component.businesses.set([duplicate]);
    component.commentDrafts[business.key] = 'Keep the previous lead in its original campaign.';
    const saving = component.saveBusiness(duplicate);
    const request = http.expectOne('/api/businesses/' + business.key);
    request.flush({ ...business, status: 'contacted', comments: component.commentDrafts[business.key], website: 'https://example.com/original', evidence: [] });
    await saving;
    expect(component.businesses()[0]).toEqual({ ...duplicate, comments: 'Keep the previous lead in its original campaign.' });
    component.filter.set('leads');
    expect(component.filteredBusinesses()).toEqual([]);
  });

  it('rejects executable evidence links while supporting authenticated screenshots', () => {
    const component = TestBed.createComponent(CampaignsComponent).componentInstance;
    expect(component.safeLink('javascript:alert(1)')).toBeNull();
    expect(component.safeLink('file:///private.txt')).toBeNull();
    expect(component.safeLink('https://example.com/')).toBe('https://example.com/');
    expect(component.screenshot('/screenshots/evidence.png')).toContain('/screenshots/evidence.png');
    expect(component.screenshot(screenshotFilename)).toBe('/screenshots/' + screenshotFilename);
    expect(component.screenshot('../private.png')).toBeNull();
    expect(component.screenshot('/screenshots/../../private.png')).toBeNull();
    expect(component.screenshot('screenshot.svg')).toBeNull();
  });
});
