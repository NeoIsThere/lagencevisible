import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
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
const ineligible: ProcessedBusiness = {
  ...business, status: 'not eligible', evaluationStatus: 'not eligible',
  reasonForStatus: { code: 'NO_WEBSITE_ISSUE', details: 'No major website issue was found by the automated checks.' },
};
const manuallyEligible: ProcessedBusiness = {
  ...ineligible, status: 'new', evaluationStatus: 'new',
  reasonForStatus: { code: 'MANUALLY_ELIGIBLE', details: 'The booking link visibly fails after selecting a service.' },
  manualEligibility: { markedAt: '2026-10-09T09:00:00Z', previousReasonForStatus: ineligible.reasonForStatus },
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

  it('marks the selected business eligible with a trimmed reason and updates campaign counts, status and filters', async () => {
    const component = TestBed.createComponent(CampaignsComponent).componentInstance;
    const running: Campaign = { ...campaign, id: 'campaign/with space', status: 'running', completedAt: null, leadCount: 4 };
    const target = { ...ineligible, key: 'business/with space' };
    const otherBusiness = { ...business, key: 'other-business' };
    component.campaigns.set([running]); component.selected.set(running);
    component.businesses.set([target, otherBusiness]); component.filter.set('not eligible');
    component.commentDrafts[target.key] = 'Unsaved note for this business.';
    component.commentDrafts[otherBusiness.key] = 'Unrelated unsaved note.';
    component.statusDrafts[otherBusiness.key] = 'contacted';
    component.beginEligibility(target); component.eligibilityReason = '  ' + manuallyEligible.reasonForStatus.details + '  ';
    const marking = component.markEligible(target);
    const request = http.expectOne('/api/campaigns/campaign%2Fwith%20space/businesses/business%2Fwith%20space/eligibility');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ reason: manuallyEligible.reasonForStatus.details });
    const completed = { ...running, status: 'completed', completedAt: '2026-10-09T09:00:00Z', reasonForCompletion: 'lead_limit', leadCount: 5 };
    request.flush({ business: { ...manuallyEligible, key: target.key }, campaign: completed });
    await marking;
    expect(component.selected()).toEqual(completed);
    expect(component.campaigns()[0]).toEqual(completed);
    expect(component.running()).toBeUndefined();
    expect(component.filter()).toBe('all');
    expect(component.filteredBusinesses()[0].status).toBe('new');
    expect(component.businesses()[1]).toEqual(otherBusiness);
    expect(component.commentDrafts).toEqual({ [target.key]: 'Unsaved note for this business.', [otherBusiness.key]: 'Unrelated unsaved note.' });
    expect(component.statusDrafts[otherBusiness.key]).toBe('contacted');
    expect(component.eligibilityEditor()).toBeNull();
    expect(component.markingEligible()).toBe(false);
  });

  it('renders the manual action inline and retains the original automated reason after marking a completed campaign business', async () => {
    const fixture = TestBed.createComponent(CampaignsComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    http.expectOne('/api/campaigns').flush([]); http.expectOne('/api/regions').flush([]);
    await fixture.whenStable();
    component.selected.set(campaign); component.campaigns.set([campaign]);
    component.businesses.set([ineligible]); component.expanded.set(ineligible.key);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const action = Array.from(root.querySelectorAll('button')).find(button => button.textContent?.trim() === 'Mark eligible');
    expect(action).toBeTruthy(); action!.click();
    fixture.detectChanges(); await fixture.whenStable();
    const reason = root.querySelector<HTMLTextAreaElement>('textarea[name="eligibilityReason"]')!;
    expect(reason.required).toBe(true); expect(reason.maxLength).toBe(4000);
    reason.value = manuallyEligible.reasonForStatus.details; reason.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    reason.closest('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    http.expectOne('/api/campaigns/' + campaign.id + '/businesses/' + ineligible.key + '/eligibility')
      .flush({ business: manuallyEligible, campaign: { ...campaign, leadCount: 2 } });
    await fixture.whenStable(); fixture.detectChanges();
    expect(root.textContent).toContain(manuallyEligible.reasonForStatus.details);
    expect(root.textContent).toContain('Marked eligible manually on 09 Oct 2026');
    expect(root.textContent).toContain('Original automated reason');
    expect(root.textContent).toContain(ineligible.reasonForStatus.details);
    expect(root.querySelector('textarea[name="eligibilityReason"]')).toBeNull();
    expect(root.querySelector('select[name="status"]')).toBeTruthy();
    expect(root.querySelector('img')?.getAttribute('src')).toBe('/screenshots/' + screenshotFilename);
    expect(component.selected()?.status).toBe('completed');
  });

  it('never offers or submits manual eligibility for duplicates or unidentified businesses', async () => {
    const fixture = TestBed.createComponent(CampaignsComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    http.expectOne('/api/campaigns').flush([]); http.expectOne('/api/regions').flush([]);
    await fixture.whenStable(); component.selected.set(campaign);
    const blocked = [
      { ...ineligible, reasonForStatus: { code: 'ALREADY_RETURNED', details: 'Already a lead.' } },
      { ...ineligible, reasonForStatus: { code: 'UNKNOWN_IDENTITY', details: 'Unknown identity.' } },
      { ...ineligible, name: ' ' }, { ...ineligible, city: '' },
    ];
    for (const item of blocked) {
      component.businesses.set([item]); component.expanded.set(item.key); fixture.detectChanges();
      expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Mark eligible');
      component.eligibilityReason = 'Reviewed.'; await component.markEligible(item);
    }
    http.expectNone(request => request.url.endsWith('/eligibility'));
  });

  it('requires a reason and preserves the rejected evaluation after a server conflict', async () => {
    const component = TestBed.createComponent(CampaignsComponent).componentInstance;
    component.selected.set(campaign); component.campaigns.set([campaign]); component.businesses.set([ineligible]);
    component.beginEligibility(ineligible);
    for (const reason of ['   ', 'x'.repeat(4001)]) {
      component.eligibilityReason = reason; await component.markEligible(ineligible);
      expect(component.eligibilityError()).toContain('1 to 4,000');
    }
    http.expectNone(request => request.url.endsWith('/eligibility'));
    component.eligibilityReason = 'I reviewed the website.';
    const marking = component.markEligible(ineligible);
    http.expectOne('/api/campaigns/' + campaign.id + '/businesses/' + ineligible.key + '/eligibility')
      .flush({ error: 'This business has already been returned by another campaign.' }, { status: 409, statusText: 'Conflict' });
    await marking;
    expect(component.eligibilityError()).toContain('already been returned');
    expect(component.eligibilityReason).toBe('I reviewed the website.');
    expect(component.eligibilityEditor()).toBe(ineligible.key);
    expect(component.businesses()).toEqual([ineligible]); expect(component.selected()).toEqual(campaign);
    expect(component.markingEligible()).toBe(false);
  });

  it('does not apply a late eligibility response to another selected campaign or its drafts', async () => {
    const component = TestBed.createComponent(CampaignsComponent).componentInstance;
    const otherCampaign = { ...campaign, id: 'campaign-2', leadCount: 0 };
    const otherEvaluation = { ...ineligible, reasonForStatus: { code: 'ALREADY_RETURNED', details: 'Another campaign evaluation of this same business.' } };
    component.selected.set(campaign); component.campaigns.set([campaign, otherCampaign]); component.businesses.set([ineligible]);
    component.beginEligibility(ineligible); component.eligibilityReason = manuallyEligible.reasonForStatus.details;
    const marking = component.markEligible(ineligible);
    const request = http.expectOne('/api/campaigns/' + campaign.id + '/businesses/' + ineligible.key + '/eligibility');
    vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const selecting = component.selectCampaign(otherCampaign);
    await Promise.resolve();
    http.expectOne('/api/campaigns/campaign-2').flush(otherCampaign);
    http.expectOne('/api/campaigns/campaign-2/businesses').flush([otherEvaluation]);
    await selecting;
    component.filter.set('not eligible'); component.commentDrafts[ineligible.key] = 'Draft in the second campaign.';
    request.flush({ business: manuallyEligible, campaign: { ...campaign, leadCount: 2 } }); await marking;
    expect(component.selected()).toEqual(otherCampaign);
    expect(component.businesses()).toEqual([otherEvaluation]);
    expect(component.commentDrafts[ineligible.key]).toBe('Draft in the second campaign.');
    expect(component.filter()).toBe('not eligible'); expect(component.notice()).toBe('');
    expect(component.campaigns().find(item => item.id === campaign.id)?.leadCount).toBe(2);
  });
});
