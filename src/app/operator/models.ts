export interface Region { id: string; name: string; cities: string[]; businessFamilies: string[] }
export const LEAD_STATUSES = ['new', 'contacted', 'signed', 'paid - not delivered', 'not paid - delivered', 'completed'] as const;
export type LeadStatus = typeof LEAD_STATUSES[number];
export interface Evidence { kind: string; url: string; observedAt: string; facts: string[]; screenshot?: string }
export interface ProcessedBusiness {
  key: string; name: string; city: string; email: string | null; phone: string | null; website: string | null;
  status: LeadStatus | 'not eligible'; evaluationStatus: 'new' | 'not eligible';
  reasonForStatus: { code: string; details: string; issues?: Array<{ code: string; details: string; url?: string }> };
  comments: string; evidence: Evidence[]; evaluatedAt: string;
}
export interface Campaign {
  id: string; status: 'running' | 'completed'; reasonForCompletion: string | null; completionDetails: string | null;
  regionId: string; regionName: string; businessFamily: string; cities: string[];
  queries: Array<{ city: string; businessFamily: string; startedAt: string; completedAt: string | null; returnedCount: number; processedCount: number }>;
  currentCity: string | null; startedAt: string; completedAt: string | null; maxLeads: number;
  maxDurationMinutes: number; maxApiCostUsd: number; leadCount: number; processedCount: number; costUsd: number;
}
export interface Settings { maxLeads: number; maxDurationMinutes: number; maxApiCostUsd: number }
export interface Configuration { settings: Settings; environment: Record<string, unknown> }
export type Connections = Array<{ provider: string; status: string; detail: string; checkedAt: string | null }>;
