import { DatePipe, DecimalPipe, isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnDestroy, OnInit, PLATFORM_ID, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { firstValueFrom, forkJoin } from 'rxjs';
import { ApiService, errorMessage, readable } from '../api.service';
import { Campaign, LEAD_STATUSES, LeadStatus, ProcessedBusiness, Region } from '../models';
import { operatorApiUrl } from '../../core/site.config';

@Component({
  selector: 'app-campaigns', imports: [FormsModule, DatePipe, DecimalPipe, RouterLink],
  templateUrl: './campaigns.component.html', styleUrl: './campaigns.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CampaignsComponent implements OnInit, OnDestroy {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private timer?: ReturnType<typeof setTimeout>;
  private detailRequest = 0;
  private revision = 0;
  private selectionRevision = 0;
  private destroyed = false;
  readonly campaigns = signal<Campaign[]>([]);
  readonly regions = signal<Region[]>([]);
  readonly selected = signal<Campaign | null>(null);
  readonly businesses = signal<ProcessedBusiness[]>([]);
  readonly loading = signal(true);
  readonly detailLoading = signal(false);
  readonly busy = signal(false);
  readonly saving = signal<string | null>(null);
  readonly markingEligible = signal(false);
  readonly eligibilityEditor = signal<string | null>(null);
  readonly eligibilityError = signal('');
  readonly error = signal('');
  readonly notice = signal('');
  readonly expanded = signal<string | null>(null);
  readonly now = signal(Date.now());
  readonly running = computed(() => this.campaigns().find(item => item.status === 'running'));
  readonly families = computed(() => this.regions().find(region => region.id === this.regionId())?.businessFamilies ?? []);
  readonly filteredBusinesses = computed(() => this.businesses().filter(item => this.filter() === 'all' || (this.filter() === 'leads' ? item.evaluationStatus === 'new' : item.evaluationStatus === 'not eligible')));
  readonly regionId = signal('');
  readonly filter = signal('all');
  readonly statuses = LEAD_STATUSES;
  readonly readable = readable;
  businessFamily = '';
  eligibilityReason = '';
  commentDrafts: Partial<Record<string, string>> = {};
  statusDrafts: Partial<Record<string, LeadStatus>> = {};

  ngOnInit(): void { void this.refresh(); }
  ngOnDestroy(): void { this.destroyed = true; clearTimeout(this.timer); }

  async refresh(): Promise<void> {
    if (this.markingEligible()) return;
    clearTimeout(this.timer);
    this.error.set('');
    this.loading.set(true);
    const revision = this.revision;
    try {
      const result = await firstValueFrom(forkJoin({ campaigns: this.api.campaigns(), regions: this.api.regions() }));
      if (this.destroyed || revision !== this.revision) return;
      this.campaigns.set(result.campaigns);
      this.regions.set(result.regions);
      if (!result.regions.some(region => region.id === this.regionId())) this.selectRegion(result.regions[0]?.id ?? '');
      const requested = this.route.snapshot.queryParamMap.get('campaign');
      const selectedId = this.selected()?.id ?? requested ?? this.running()?.id ?? result.campaigns[0]?.id;
      if (selectedId && result.campaigns.some(item => item.id === selectedId)) await this.loadDetail(selectedId);
      this.schedulePoll();
    } catch (error) { this.error.set(errorMessage(error)); }
    finally { this.loading.set(false); }
  }

  selectRegion(id: string): void { this.regionId.set(id); this.businessFamily = this.families()[0] ?? ''; }

  async selectCampaign(campaign: Campaign): Promise<void> {
    const selection = ++this.selectionRevision;
    this.detailRequest++;
    this.eligibilityEditor.set(null); this.eligibilityReason = ''; this.eligibilityError.set('');
    this.expanded.set(null);
    this.filter.set('all');
    this.commentDrafts = {};
    this.statusDrafts = {};
    this.selected.set(campaign);
    this.businesses.set([]);
    await this.router.navigate([], { relativeTo: this.route, queryParams: { campaign: campaign.id }, replaceUrl: true });
    if (this.destroyed || selection !== this.selectionRevision) return;
    try { await this.loadDetail(campaign.id); }
    catch (error) { this.error.set(errorMessage(error)); }
  }

  private async loadDetail(id: string): Promise<void> {
    const request = ++this.detailRequest;
    this.detailLoading.set(true);
    try {
      const result = await firstValueFrom(forkJoin({ campaign: this.api.campaign(id), businesses: this.api.businesses(id) }));
      if (this.destroyed || request !== this.detailRequest) return;
      this.selected.set(result.campaign);
      this.businesses.set(result.businesses);
    } finally { if (request === this.detailRequest) this.detailLoading.set(false); }
  }

  private schedulePoll(): void {
    clearTimeout(this.timer);
    if (!this.browser || this.destroyed || !this.running()) return;
    this.timer = setTimeout(() => void this.poll(), 5000);
  }

  private async poll(): Promise<void> {
    if (this.destroyed) return;
    if (this.busy() || this.saving() || this.markingEligible()) { this.schedulePoll(); return; }
    const revision = this.revision;
    try {
      const campaigns = await firstValueFrom(this.api.campaigns());
      if (this.destroyed || revision !== this.revision) return;
      if (this.busy() || this.saving() || this.markingEligible()) { this.schedulePoll(); return; }
      this.campaigns.set(campaigns);
      this.now.set(Date.now());
      const selected = this.selected();
      if (selected?.status === 'running') await this.loadDetail(selected.id);
      this.schedulePoll();
    } catch (error) { this.error.set(errorMessage(error)); }
  }

  async start(): Promise<void> {
    if (this.busy() || this.markingEligible() || this.running() || !this.regionId() || !this.businessFamily) return;
    this.busy.set(true); this.error.set(''); this.notice.set('');
    this.revision++;
    try {
      const campaign = await firstValueFrom(this.api.startCampaign(this.regionId(), this.businessFamily));
      this.campaigns.update(items => [campaign, ...items]);
      await this.selectCampaign(campaign);
      clearTimeout(this.timer); this.schedulePoll();
    } catch (error) { this.error.set(errorMessage(error)); }
    finally { this.busy.set(false); this.schedulePoll(); }
  }

  async stop(campaign: Campaign): Promise<void> {
    if (this.busy() || this.markingEligible()) return;
    this.busy.set(true); this.error.set('');
    this.revision++; this.detailRequest++; this.detailLoading.set(false);
    try {
      const updated = await firstValueFrom(this.api.stopCampaign(campaign.id));
      this.campaigns.update(items => items.map(item => item.id === updated.id ? updated : item));
      if (this.selected()?.id === updated.id) await this.loadDetail(updated.id);
      clearTimeout(this.timer);
      this.notice.set('Campaign stopped. Evaluated businesses have been saved.');
    } catch (error) { this.error.set(errorMessage(error)); }
    finally { this.busy.set(false); this.schedulePoll(); }
  }

  async saveBusiness(business: ProcessedBusiness): Promise<void> {
    if (this.saving() || this.markingEligible()) return;
    this.saving.set(business.key); this.error.set(''); this.notice.set('');
    this.detailRequest++; this.detailLoading.set(false);
    const changes: { comments?: string; status?: LeadStatus } = {};
    if (Object.hasOwn(this.commentDrafts, business.key)) changes.comments = this.commentDrafts[business.key];
    if (business.evaluationStatus === 'new' && this.statusDrafts[business.key]) changes.status = this.statusDrafts[business.key];
    try {
      const updated = await firstValueFrom(this.api.updateBusiness(business.key, changes));
      // PATCH returns the global business. Preserve this campaign's evaluation snapshot.
      this.businesses.update(items => items.map(item => item.key === updated.key ? {
        ...item,
        comments: updated.comments,
        status: item.evaluationStatus === 'new' && updated.status !== 'not eligible' ? updated.status : item.status,
      } : item));
      delete this.commentDrafts[business.key]; delete this.statusDrafts[business.key];
      this.notice.set('Business updated.');
    } catch (error) { this.error.set(errorMessage(error)); }
    finally { this.saving.set(null); }
  }

  hasChanges(business: ProcessedBusiness): boolean {
    return (Object.hasOwn(this.commentDrafts, business.key) && this.commentDrafts[business.key] !== business.comments)
      || (!!this.statusDrafts[business.key] && this.statusDrafts[business.key] !== business.status);
  }

  canMarkEligible(business: ProcessedBusiness): boolean {
    return business.evaluationStatus === 'not eligible' && business.status === 'not eligible'
      && !!business.name.trim() && !!business.city.trim()
      && !['ALREADY_RETURNED', 'UNKNOWN_IDENTITY'].includes(business.reasonForStatus.code.toUpperCase());
  }

  beginEligibility(business: ProcessedBusiness): void {
    if (!this.canMarkEligible(business) || this.markingEligible() || this.saving() || this.busy()) return;
    this.eligibilityEditor.set(business.key); this.eligibilityReason = ''; this.eligibilityError.set('');
  }

  cancelEligibility(): void {
    if (this.markingEligible()) return;
    this.eligibilityEditor.set(null); this.eligibilityReason = ''; this.eligibilityError.set('');
  }

  async markEligible(business: ProcessedBusiness): Promise<void> {
    const campaign = this.selected();
    if (!campaign || this.markingEligible() || this.busy() || this.saving() || !this.canMarkEligible(business)) return;
    if (!this.businesses().some(item => item.key === business.key && this.canMarkEligible(item))) return;
    const reason = this.eligibilityReason.trim();
    if (!reason || reason.length > 4000) {
      this.eligibilityError.set('Explain why this business should be a lead, using 1 to 4,000 characters.'); return;
    }
    const selection = this.selectionRevision;
    this.markingEligible.set(true); this.eligibilityError.set(''); this.error.set(''); this.notice.set('');
    this.revision++; this.detailRequest++; this.detailLoading.set(false); clearTimeout(this.timer);
    try {
      const updated = await firstValueFrom(this.api.markEligible(campaign.id, business.key, reason));
      if (this.destroyed) return;
      this.campaigns.update(items => items.map(item => item.id === updated.campaign.id ? updated.campaign : item));
      if (this.selected()?.id !== campaign.id || this.selectionRevision !== selection) return;
      this.detailRequest++;
      this.selected.set(updated.campaign);
      this.businesses.update(items => items.map(item => item.key === business.key ? updated.business : item));
      if (this.filter() === 'not eligible') this.filter.set('all');
      this.eligibilityEditor.set(null); this.eligibilityReason = '';
      this.notice.set(`${business.name} marked eligible.`);
    } catch (error) {
      if (!this.destroyed && this.selected()?.id === campaign.id && this.selectionRevision === selection) this.eligibilityError.set(errorMessage(error));
    } finally { this.markingEligible.set(false); this.schedulePoll(); }
  }

  elapsed(campaign: Campaign): string {
    const seconds = Math.max(0, Math.floor(((campaign.completedAt ? new Date(campaign.completedAt).getTime() : this.now()) - new Date(campaign.startedAt).getTime()) / 1000));
    return seconds >= 3600 ? `${Math.floor(seconds / 3600)}h ${Math.floor(seconds % 3600 / 60)}m` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  }

  completion(campaign: Campaign): string {
    const labels: Record<string, string> = { lead_limit: 'Lead limit reached', duration_limit: 'Time limit reached', budget_limit: 'API budget reached', api_limit: 'API limit reached', manual_stop: 'Stopped manually', cities_exhausted: 'All cities evaluated', error: 'Stopped after an error', interrupted: 'Interrupted by a restart' };
    return labels[campaign.reasonForCompletion ?? ''] ?? readable(campaign.reasonForCompletion ?? '');
  }

  safeLink(value: string | null | undefined): string | null {
    if (!value) return null;
    try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.href : null; } catch { return null; }
  }
  screenshot(value: string): string | null {
    if (/^[a-zA-Z0-9_-]+\.png$/.test(value)) return operatorApiUrl('/screenshots/' + value);
    if (/^\/screenshots\/[a-zA-Z0-9_-]+\.png$/.test(value)) return operatorApiUrl(value);
    return this.safeLink(value);
  }
}
