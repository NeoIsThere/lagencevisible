import type { ScheduledSearchDetail, ScheduledSearchFinding, ScheduledSearchSummary, ScheduledSubsearchDetail, ScheduledSubsearchSummary } from "../models";

export function campaignFixture(id: number, status: ScheduledSearchSummary["status"] = "COMPLETED"): ScheduledSearchSummary {
  return { id, status, mode: "POOR_WEBSITE", clusterId: "SOUTH_RIVIERA", locationLabel: id === 12 ? "Côte d’Azur" : "Lyon",
    queuePosition: status === "QUEUED" ? 1 : null, continueUntilValidatedLead: true, targetSubsearchCount: 10,
    terminalSubsearchCount: status === "COMPLETED" ? 10 : 1, totalSubsearchCount: 2, validatedLeadCount: 1,
    maxSubsearchCount: 30, maxDurationHours: 168, maxConsecutiveNoProgress: 10, estimatedCostEur: 1.24, maxCostEur: 10,
    retryAt: null, waitingReason: null, currentSubsearch: status === "RUNNING" ? subsearchFixture(122, "RUNNING") : null,
    lastError: null, createdAt: "2026-09-28T10:00:00Z", startedAt: "2026-09-28T10:00:00Z", completedAt: status === "COMPLETED" ? "2026-09-28T11:00:00Z" : null };
}
export function subsearchFixture(id: number, status: ScheduledSubsearchSummary["status"] = "COMPLETED"): ScheduledSubsearchSummary {
  return { id, status, query: id === 122 ? "pisciniste" : "menuisier", municipalityLabel: id === 122 ? "Antibes" : "Cannes",
    businessFamilyLabel: id === 122 ? "Piscines et extérieurs" : "Menuiserie", executionSearchId: `execution-${id}`,
    rawResultCount: 6, newUniqueCount: 5, duplicateCount: 1, autoExcludedCount: 2, auditedCount: 3, qualifiedCount: 2, validEmailCount: 3,
    lastError: null, createdAt: "2026-09-28T10:00:00Z", startedAt: "2026-09-28T10:00:00Z", completedAt: status === "COMPLETED" ? "2026-09-28T11:00:00Z" : null };
}
export function businessFixture(id: string, overrides: Partial<ScheduledSearchFinding> = {}): ScheduledSearchFinding {
  return { id, businessName: id, city: "Antibes", status: "discovered", outcome: "excluded", selection: "not_selected", stage: "discovery",
    reason: "The subsearch business limit was reached. This business was saved for another subsearch.", failureCode: null, retryAt: null,
    finalScore: null, websiteUrl: "https://example.com", mapsUrl: null, address: null, hasEmail: false, hasPhone: true, hasContactForm: false,
    hasSocial: false, isFirstDiscovery: true, resultRank: 1, source: "lead", createdAt: "2026-09-28T10:00:00Z", ...overrides };
}
export function subsearchDetailFixture(id = 122): ScheduledSubsearchDetail {
  return { subsearch: subsearchFixture(id, id === 122 ? "RUNNING" : "COMPLETED"), steps: [], progress: null,
    activeWork: id === 122 ? { stage: "enrichment", label: "Website and contacts", detail: "Checking the website and public contact information for this business.", businessName: "Azur Piscines", businessCity: "Antibes", websiteUrl: null,
      provider: "Public websites", taskStatus: "running", attempt: 1, maxAttempts: 3, activityAt: "2026-09-28T10:00:00Z", availableAt: null, lastError: null } : null,
    findings: [
      businessFixture("Riviera Piscines", { outcome: "candidate", selection: "selected", stage: "complete", reason: "This business passed evaluation and an email was prepared for review.", hasEmail: true, finalScore: 80 }),
      businessFixture("Piscines du Sud", { resultRank: 2, stage: "enrichment", outcome: "needs_research", reason: "No public email could be attributed to this business. A phone number was preserved." }),
      businessFixture("Atelier Méditerranée", { resultRank: 3 }),
      businessFixture("Azur Piscines", { resultRank: 4, outcome: id === 122 ? "evaluating" : "excluded", selection: id === 122 ? "pending" : "not_selected", stage: "enrichment", reason: id === 122 ? "Website and contact checks are in progress." : "Website checks could not finish before the campaign ended." }),
      businessFixture("Pool Design", { resultRank: 5, stage: "analysis", reason: "The collected evidence did not support a contained €500–€1,000 offer." }),
      businessFixture("Piscines de Provence", { resultRank: 6, outcome: "duplicate", reason: "This business was already known and was not evaluated again in this subsearch." }),
    ] };
}
export function campaignDetailFixture(id: number): ScheduledSearchDetail {
  const active = id === 12;
  const first = subsearchFixture(active ? 121 : 111);
  const last = subsearchFixture(active ? 122 : 112, active ? "RUNNING" : "COMPLETED");
  return { search: campaignFixture(id, active ? "RUNNING" : "COMPLETED"), queuedCount: 1, subsearches: [first, last], currentSubsearchDetail: subsearchDetailFixture(last.id) };
}
