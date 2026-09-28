import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import type {
  ApplicationLogsResponse,
  DatabasePage,
  DatabaseTableSummary,
  EngineStatus,
  EnvironmentVariable,
  Lead,
  ManualResearchLead,
  ScheduledSearchDetail,
  ScheduledSearchListResponse,
  ScheduledSubsearchDetail,
  ScheduleSearchResponse,
  SearchRun,
  StrategyDataSnapshot,
  StrategyCatalog,
  StrategyMode,
} from "./models";

@Injectable({ providedIn: "root" })
export class ApiService {
  private readonly http = inject(HttpClient);

  nextLead() {
    return this.http.get<{ lead: Lead | null }>("/api/queue/next");
  }

  reviewQueue() {
    return this.http.get<{ leads: Lead[]; total: number }>("/api/queue");
  }

  send(id: string) {
    return this.http.post<{ ok: boolean; status: string }>(`/api/leads/${encodeURIComponent(id)}/send`, {});
  }

  reject(id: string) {
    return this.http.post<{ ok: boolean; status: string }>(`/api/leads/${encodeURIComponent(id)}/reject`, {});
  }

  history() {
    return this.http.get<{ leads: Lead[] }>("/api/history");
  }

  manualResearch() {
    return this.http.get<{ leads: ManualResearchLead[]; total: number }>("/api/manual-research");
  }

  retryCandidateEvidence(id: string) {
    return this.http.post<{ ok: boolean; queued: boolean; status: string }>(
      `/api/manual-research/${encodeURIComponent(id)}/retry`,
      {},
    );
  }

  status() {
    return this.http.get<EngineStatus>("/api/status");
  }

  strategyCatalog() {
    return this.http.get<StrategyCatalog>("/api/strategy/catalog");
  }

  strategyData() {
    return this.http.get<StrategyDataSnapshot>("/api/strategy/data");
  }

  strategySchedules() {
    return this.http.get<ScheduledSearchListResponse>("/api/strategy/schedules");
  }

  scheduleStrategySearch(configuration: {
    mode: StrategyMode;
    clusterId: string;
    continueUntilValidatedLead: boolean;
  }) {
    return this.http.post<ScheduleSearchResponse>("/api/strategy/schedules", configuration);
  }

  pauseStrategySchedule(id: number) {
    return this.http.post<ScheduleSearchResponse>(
      `/api/strategy/schedules/${encodeURIComponent(String(id))}/pause`,
      {},
    );
  }

  resumeStrategySchedule(id: number) {
    return this.http.post<ScheduleSearchResponse>(
      `/api/strategy/schedules/${encodeURIComponent(String(id))}/resume`,
      {},
    );
  }

  cancelStrategySchedule(id: number) {
    return this.http.post<ScheduleSearchResponse>(
      `/api/strategy/schedules/${encodeURIComponent(String(id))}/cancel`,
      {},
    );
  }

  strategySchedule(id: number) {
    return this.http.get<ScheduledSearchDetail>(`/api/strategy/schedules/${encodeURIComponent(String(id))}`);
  }

  strategyScheduleSubsearch(id: number, subsearchId: number) {
    return this.http.get<ScheduledSubsearchDetail>(
      `/api/strategy/schedules/${encodeURIComponent(String(id))}/subsearches/${encodeURIComponent(String(subsearchId))}`,
    );
  }

  startSearch(configuration: {
    query: string;
    cities: string[];
    maxResults: number;
  }) {
    return this.http.post<{ ok: boolean; search: SearchRun }>("/api/searches", configuration);
  }

  databaseTables() {
    return this.http.get<{ tables: DatabaseTableSummary[] }>("/api/operator/database/tables");
  }

  databasePage(table: string, limit = 50, offset = 0) {
    return this.http.get<DatabasePage>(
      `/api/operator/database/${encodeURIComponent(table)}?limit=${limit}&offset=${offset}`,
    );
  }

  environment() {
    return this.http.get<{ variables: EnvironmentVariable[] }>("/api/operator/environment");
  }

  applicationLogs(filters: { service: string; level: string; q: string }) {
    return this.http.get<ApplicationLogsResponse>("/api/operator/logs", { params: { ...filters, limit: 300 } });
  }
}
