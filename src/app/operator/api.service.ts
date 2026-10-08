import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type { Campaign, Configuration, Connections, LeadStatus, ProcessedBusiness, Region, Settings } from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  regions() { return this.http.get<Region[]>('/api/regions'); }
  createRegion(region: Omit<Region, 'id'>) { return this.http.post<Region>('/api/regions', region); }
  updateRegion(id: string, region: Omit<Region, 'id'>) { return this.http.put<Region>('/api/regions/' + encodeURIComponent(id), region); }
  deleteRegion(id: string) { return this.http.delete<void>('/api/regions/' + encodeURIComponent(id)); }
  configuration() { return this.http.get<Configuration>('/api/config'); }
  saveSettings(settings: Settings) { return this.http.put<Configuration>('/api/config', settings); }
  connections() { return this.http.get<Connections>('/api/connections'); }
  checkConnections() { return this.http.post<Connections>('/api/connections/check', {}); }
  campaigns() { return this.http.get<Campaign[]>('/api/campaigns'); }
  campaign(id: string) { return this.http.get<Campaign>('/api/campaigns/' + encodeURIComponent(id)); }
  startCampaign(regionId: string, businessFamily: string) { return this.http.post<Campaign>('/api/campaigns', { regionId, businessFamily }); }
  stopCampaign(id: string) { return this.http.post<Campaign>('/api/campaigns/' + encodeURIComponent(id) + '/stop', {}); }
  businesses(id: string) { return this.http.get<ProcessedBusiness[]>('/api/campaigns/' + encodeURIComponent(id) + '/businesses'); }
  updateBusiness(key: string, changes: { status?: LeadStatus; comments?: string }) {
    return this.http.patch<ProcessedBusiness>('/api/businesses/' + encodeURIComponent(key), changes);
  }
}
export function errorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    const message = error.error?.error?.message ?? error.error?.message ?? error.error?.error;
    if (typeof message === 'string') return message;
    if (error.status === 0) return 'Cannot connect to the backend. Check the connection, then refresh.';
  }
  return 'The request could not be completed. Refresh to check the current state.';
}
export function readable(value: string): string {
  return value.replace(/[_-]+/g, ' ').replace(/^./, first => first.toUpperCase());
}
