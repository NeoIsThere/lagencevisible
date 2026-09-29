export interface ApplicationLogEntry {
  id: string;
  service: "api" | "worker";
  level: "info" | "warn" | "error";
  message: string;
  createdAt: string;
}

export interface ApplicationLogsResponse {
  entries: ApplicationLogEntry[];
  hasMore: boolean;
  retentionDays: number;
  maxStoredEntries: number;
}

export interface WebsiteProblem {
  problem: string;
  evidence: string;
  businessImpact: string;
  recommendedFix: string;
  category?: string;
  severity?: "minor" | "moderate" | "major" | "critical";
  confidence?: number;
  evidenceSource?: string;
  independentEvidence?: string[];
}

export interface WebsiteCondition {
  classification: "NO_WEBSITE" | "SEVERELY_POOR" | "SEVERELY_OUTDATED" | "ACCEPTABLE" | "UNKNOWN";
  confidence: number;
  screenshotReviewed: boolean;
  decisiveEvidence: string[];
}

export interface ImplementationPlanItem {
  task: string;
  whatYouDo: string;
  deliverable: string;
  aiAssistedHours: number;
  clientInputNeeded: string;
}

export interface CommercialEstimate {
  currency: "EUR";
  recommendedPriceEur: number;
  priceRangeMinEur: number;
  priceRangeMaxEur: number;
  aiAssistedHoursMin: number;
  aiAssistedHoursMax: number;
  recommendedScope: string;
  pricingRationale: string;
  assumptions: string[];
  implementationPlan: ImplementationPlanItem[];
}

export interface DeliveryApproach {
  strategy: "optimize_existing" | "partial_rebuild" | "full_rebuild" | "migrate_platform" | "new_website";
  recommendation: string;
  why: string;
  accessRisk: "low" | "medium" | "high";
  accessRiskReason: string;
  requiredAccess: string[];
  discoveryQuestions: string[];
  rebuildTriggers: string[];
}

export type AiProvider = 'openai';
export type StoredAiProvider = AiProvider | 'codex';
export type AiTaskKind = 'lead_analysis' | 'email_draft';

/** NO_WEBSITE is retained only for rendering historical campaigns. */
export type StrategyMode = "NO_WEBSITE" | "POOR_WEBSITE";
export type ActiveStrategyMode = "POOR_WEBSITE";
export type StrategySelectionPhase = "COLD_START" | "EXPLOITATION" | "EXPLORATION";

export interface StrategyCatalogMode {
  id: ActiveStrategyMode;
  label: string;
}

export interface StrategyCatalogCluster {
  id: string;
  region: string;
  label: string;
  municipalityCount: number;
  recommendedModePriority: Record<ActiveStrategyMode, number>;
}

export interface StrategyCatalog {
  strategyVersion: number;
  checksum: string;
  modes: StrategyCatalogMode[];
  clusters: StrategyCatalogCluster[];
}

export interface StrategyCurrentSearch {
  strategySearchRunId: number;
  executionSearchId: string | null;
  query: string;
  municipalityLabel: string;
  businessFamilyLabel: string;
  phase: StrategySelectionPhase;
  finalSchedulerScore: number;
}

export type ScheduledSearchStatus =
  | "QUEUED"
  | "RUNNING"
  | "WAITING"
  | "PAUSED"
  | "EXHAUSTED"
  | "COMPLETED"
  | "FAILED"
  | "BLOCKED"
  | "CANCELLED";

export type ScheduledSubsearchStatus =
  | "PENDING"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "BLOCKED"
  | "CANCELLED";

export interface ScheduledSearchActiveWork {
  stage: string;
  label: string;
  detail: string;
  businessName: string | null;
  businessCity: string | null;
  websiteUrl: string | null;
  provider: string;
  taskStatus: "waiting" | "running";
  attempt: number;
  maxAttempts: number;
  activityAt: string | null;
  availableAt: string | null;
  lastError: string | null;
}

export interface ScheduledSearchStep {
  stage: string;
  label: string;
  pending: number;
  running: number;
  completed: number;
  failed: number;
}

export interface ScheduledSearchFinding {
  selection?: "selected" | "not_selected" | "pending";
  id: string;
  businessName: string;
  city: string;
  status: string;
  outcome: "evaluating" | "queued" | "candidate" | "qualified" | "needs_research" | "excluded" | "duplicate";
  stage: "discovery" | "enrichment" | "analysis" | "drafting" | "complete";
  reason: string | null;
  failureCode: string | null;
  retryAt: string | null;
  finalScore: number | null;
  websiteUrl: string | null;
  mapsUrl: string | null;
  address: string | null;
  hasEmail: boolean;
  hasPhone: boolean;
  hasContactForm: boolean;
  hasSocial: boolean;
  isFirstDiscovery: boolean;
  resultRank: number | null;
  source: "lead" | "observation";
  createdAt: string;
}

export interface ScheduledSubsearchSummary {
  id: number;
  status: ScheduledSubsearchStatus;
  query: string;
  municipalityLabel: string;
  businessFamilyLabel: string;
  executionSearchId: string | null;
  rawResultCount: number;
  newUniqueCount: number;
  duplicateCount: number;
  autoExcludedCount: number;
  auditedCount: number;
  qualifiedCount: number;
  validEmailCount: number;
  lastError: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

export interface ScheduledSearchSummary {
  id: number;
  mode: StrategyMode;
  clusterId: string;
  locationLabel: string;
  status: ScheduledSearchStatus;
  queuePosition: number | null;
  continueUntilValidatedLead: boolean;
  targetSubsearchCount: number;
  terminalSubsearchCount: number;
  totalSubsearchCount: number;
  validatedLeadCount: number;
  maxSubsearchCount: number;
  maxDurationHours: number;
  maxConsecutiveNoProgress: number;
  estimatedCostEur: number;
  maxCostEur: number;
  retryAt: string | null;
  waitingReason: string | null;
  currentSubsearch: ScheduledSubsearchSummary | null;
  lastError: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

export interface ScheduledSubsearchDetail {
  subsearch: ScheduledSubsearchSummary;
  activeWork: ScheduledSearchActiveWork | null;
  steps: ScheduledSearchStep[];
  progress: SearchRun | null;
  findings: ScheduledSearchFinding[];
}

export interface ScheduledSearchDetail {
  search: ScheduledSearchSummary;
  queuedCount: number;
  subsearches: ScheduledSubsearchSummary[];
  currentSubsearchDetail: ScheduledSubsearchDetail | null;
}

export interface ScheduledSearchListResponse {
  items: ScheduledSearchSummary[];
  queuedCount: number;
  outstandingCount: number;
  currentId: number | null;
}

export interface ScheduleSearchResponse {
  ok: true;
  item: ScheduledSearchSummary;
}

export type StrategyEvidenceStage = "NONE" | "DISCOVERY_ONLY" | "QUALIFICATION" | "DELIVERY" | "SALES";

export interface StrategyLearningCounters {
  searchesRun: number;
  successfulSearches: number;
  blockedSearches: number;
  resultsSeen: number;
  uniqueBusinesses: number;
  duplicateHits: number;
  autoExcluded: number;
  auditedLeads: number;
  qualifiedLeads: number;
  validEmailLeads: number;
  queuedLeads: number;
  sentLeads: number;
  rejectedLeads: number;
  bouncedLeads: number;
  positiveReplies: number;
  meetingsBooked: number;
  wonLeads: number;
}

export interface StrategyObservedRates {
  newBusinessRate: number | null;
  duplicateRate: number | null;
  exclusionRate: number | null;
  qualifiedLeadRate: number | null;
  validEmailRate: number | null;
  sendRate: number | null;
  rejectRate: number | null;
  bounceRate: number | null;
  positiveReplyRate: number | null;
  meetingRate: number | null;
  winRate: number | null;
}

export interface StrategyLearningAggregate {
  configuredPairs: number;
  testedPairs: number;
  evidenceBackedPairs: number;
  averageTestedPairReliability: number | null;
  lastSearchAt: string | null;
  counters: StrategyLearningCounters;
  observedRates: StrategyObservedRates;
}

export interface StrategyFamilyLearning extends StrategyLearningAggregate {
  familyId: string;
  familyLabel: string;
}

export interface StrategyOpportunityLearning extends StrategyLearningAggregate {
  mode: StrategyMode;
  modeLabel: string;
  families: StrategyFamilyLearning[];
}

export interface StrategyMunicipalityLearning extends StrategyLearningAggregate {
  municipalityId: string;
  municipalityLabel: string;
}

export interface StrategyLocationOpportunityLearning extends StrategyLearningAggregate {
  mode: StrategyMode;
  modeLabel: string;
  municipalities: StrategyMunicipalityLearning[];
}

export interface StrategyLocationLearning extends StrategyLearningAggregate {
  clusterId: string;
  clusterLabel: string;
  region: string;
  opportunities: StrategyLocationOpportunityLearning[];
}

export interface StrategyModeAssumption {
  id: StrategyMode;
  label: string;
  websiteGate: Record<string, boolean | number>;
  qualificationGates: Record<string, boolean | number>;
}

export interface StrategyLeadTypeAssumption {
  id: string;
  rules: Record<string, boolean | number>;
}

export interface StrategyFamilyAssumption {
  id: string;
  label: string;
  leadType: string;
  regulatedSector: boolean;
  keywords: Array<{ query: string; priority: number }>;
  positiveSignals: string[];
  negativeSignals: string[];
  poorWebsiteWeaknesses: string[];
}

export interface StrategyLocationAssumption {
  id: string;
  label: string;
  region: string;
  recommendedModePriority: Record<ActiveStrategyMode, number>;
  municipalities: Array<{ id: string; label: string; priority: number }>;
  familyPriorities: Array<{
    familyId: string;
    familyLabel: string;
    priorities: Record<ActiveStrategyMode, number>;
  }>;
  compatibilityOverrides: Array<{
    municipalityId: string;
    municipalityLabel: string;
    familyId: string;
    familyLabel: string;
    score: number;
  }>;
}

export interface StrategyCostEconomics {
  committedEur: number;
  attributedEur: number;
  unattributedEur: number;
  attributionCoverage: number | null;
  costPerAuditedLeadEur: number | null;
  costPerValidatedEmailEur: number | null;
  costPerQueuedLeadEur: number | null;
}

export interface StrategyDataSnapshot {
  generatedAt: string;
  strategyVersion: number;
  checksum: string;
  counterScope: "ACTIVE_STRATEGY_VERSION";
  evidenceStage: StrategyEvidenceStage;
  totals: StrategyLearningAggregate;
  economics: StrategyCostEconomics;
  byOpportunity: StrategyOpportunityLearning[];
  byLocation: StrategyLocationLearning[];
  assumptions: {
    defaultLanguage: string;
    modes: StrategyModeAssumption[];
    leadTypes: StrategyLeadTypeAssumption[];
    businessFamilies: StrategyFamilyAssumption[];
    locations: StrategyLocationAssumption[];
    learningModel: Record<string, unknown>;
    globalExclusions: { nameOrCategoryContains: string[]; statuses: string[] };
  };
}

export interface AiArtifact {
  kind: AiTaskKind;
  provider: StoredAiProvider;
  status: string;
  model: string | null;
  completedAt: string | null;
  lastError: string | null;
}

export type WebOpportunityType = "NEW_SITE" | "REDESIGN" | "OPTIMIZATION" | "NONE";
export interface WebOpportunityAssessment {
  policyVersion: number;
  type: WebOpportunityType;
  businessIdentityVerified: boolean;
  allowedBusinessModel: boolean;
  businessStrength: number;
  websiteQuality: number | null;
  websiteGap: number | null;
  businessWebsiteMismatch: number | null;
  smallProjectFit: number;
  contactability: number;
  cheapRebuildFit: number;
  redesign: {
    visualObsolescence: number;
    structuralObsolescence: number;
    conversionWeakness: number;
    brandBusinessMismatch: number;
    mobileUsabilityWeakness: number | null;
    redesignOpportunityScore: number;
    confidence: number;
    strongTriggers: string[];
  };
  baseCandidateScore: number;
  activityBonus: number;
  websiteUpdateBonus: number;
  candidateScore: number;
  eligible: boolean;
  retryable: boolean;
  reasons: string[];
}

export interface Lead {
  id: string;
  businessName: string;
  city: string;
  mapsUrl: string | null;
  websiteUrl: string | null;
  contactEmail: string | null;
  contactEmailSourceUrl: string | null;
  contactName: string | null;
  audit: {
    performance?: number | null;
    accessibility?: number | null;
    bestPractices?: number | null;
    seo?: number | null;
    hasContactPage?: boolean;
    hasSecureTransport?: boolean;
    error?: string;
  } | null;
  screenshotUrl: string | null;
  scores: {
    abilityToPay: number;
    websiteNeed: number;
    contactability: number;
    final: number;
  };
  qualificationReason: string;
  websiteCondition: WebsiteCondition | null;
  communicationLanguage: "fr" | "en";
  languageReason: string;
  websiteProblems: WebsiteProblem[];
  commercialEstimate: CommercialEstimate | null;
  deliveryApproach: DeliveryApproach | null;
  webOpportunity?: WebOpportunityAssessment | null;
  webOpportunityEvidence?: {
    rebuild: {
      cheapRebuildFit: number;
      estimatedPageCount: number | null;
      reusableContent: boolean;
      reusableAssets: boolean;
      requiredComplexFeatures: string[];
      reason: string;
    };
    recentWebsiteUpdate: { sourceUrl: string; evidence: string; observedAt: string; confidence: number } | null;
  } | null;
  ranking?: {
    version: number;
    activity: number;
    ability: number;
    digitalIntent: number;
    purchaseFit: number;
    reachability: number;
    need: number;
    score: number;
    tier: "priority" | "plausible" | "exploratory";
    unknownDimensions: string[];
    acceptedSignalKinds: string[];
    acceptedSignals: Array<{ kind: string; evidence: string; sourceUrl: string; confidence: number; observedAt: string | null }>;
    ignoredSignalReasons: string[];
    hardExclusion: string | null;
  } | null;
  prospectEvidence?: {
    signals: Array<{ kind: string; evidence: string; sourceUrl: string; confidence: number; observedAt: string | null }>;
    fixedScope: {
      status: "plausible" | "needs_discovery" | "no_viable_offer";
      confidence: number;
      problemIndexes: number[];
      deliverables: string[];
      exclusions: string[];
      acceptanceCriteria: string[];
      reason: string;
    };
  } | null;
  aiArtifacts: AiArtifact[];
  email: { subject: string | null; body: string | null };
  status: string;
  failureCode: string | null;
  retryAfter: string | null;
  evidenceRefreshedAt: string | null;
  attemptGeneration: number;
  createdAt: string;
  sentAt: string | null;
  rejectedAt: string | null;
  suppressedAt: string | null;
}

export interface ManualResearchContactPoint {
  kind: "EMAIL" | "PHONE" | "CONTACT_FORM" | "SOCIAL";
  value: string;
  sourceUrl: string | null;
  confidence: number;
  verificationStatus: string;
}

export interface ManualResearchLead extends Lead {
  contactPoints: ManualResearchContactPoint[];
  refreshActive: boolean;
}

export interface SearchRun {
  id: string;
  query: string;
  city?: string | null;
  cities?: string[];
  cityCount?: number;
  maxResults: number;
  maxResultsPerCity?: number;
  cityProgress?: Array<{
    city: string;
    position: number;
    status: "queued" | "running" | "completed" | "failed";
    resultsFound: number;
    leadsQueued: number;
    duplicatesSkipped: number;
    websitesExcluded: number;
    lastError: string | null;
    startedAt: string | null;
    completedAt: string | null;
  }>;
  status: "queued" | "running" | "completed" | "failed";
  resultsFound: number;
  leadsQueued: number;
  duplicatesSkipped: number;
  websitesExcluded: number;
  missingContact: number;
  qualificationRejected: number;
  readyMatches: number;
  otherFailed: number;
  lastError: string | null;
  startedAt: string | null;
  discoveryCompletedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EngineStatus {
  leads: Record<string, number>;
  jobs: Record<string, number>;
  outbox: Record<string, number>;
  suppressions: number;
  worker: { online: boolean; heartbeatAt: string | null; phase?: string; lastError?: string | null };
  aiTasks: { pending: number; claimed: number; completed: number; failed: number };
  budget: { spent: number; reserved: number; accounted: number; limit: number; stopAt: number; byProvider: Record<string, number> };
  searches: {
    active: SearchRun | null;
    latest: SearchRun | null;
    startedToday: number;
    dailyLimit: number;
    maxResultsLimit: number;
    maxCitiesPerSearch?: number;
  };
  configuration: {
    publicAppUrl: string;
    ownerName: string;
    businessName: string;
    defaultLanguage: string;
    openaiModel: string;
    openai: { ready: boolean; missing: string[]; model: string };
    searchReady: boolean;
    missingForSearch: string[];
    services: { resend: boolean; openai: boolean; brave: boolean };
    queue: { target: number; maximum: number };
    parallelism: { worker: number; discovery: number; enrichment: number; ai: number; searches: number };
    emailLimits: { daily: number; monthly: number; timeZone: string };
  };
}

export interface DatabaseTableSummary {
  name: string;
  total: number;
}

export interface DatabasePage {
  table: string;
  columns: string[];
  rows: Array<Record<string, unknown>>;
  total: number;
  limit: number;
  offset: number;
}

export interface EnvironmentVariable {
  name: string;
  value: string;
  configured: boolean;
  redacted: boolean;
}

export type IntegrationDisplayRecord = Record<string, unknown>;

export interface IntegrationActivity {
  lastActivityAt: string | null;
  lastSuccessAt: string | null;
  lastErrorAt: string | null;
  lastError: string | null;
}

export interface IntegrationStatus {
  id: string;
  name: string;
  status: string;
  ready: boolean;
  configured: boolean;
  reason: string | null;
  purpose: string;
  configuration: IntegrationDisplayRecord;
  usage: IntegrationDisplayRecord;
  counters: IntegrationDisplayRecord;
  activity: IntegrationActivity;
}

export interface IntegrationSummary {
  total: number;
  ready: number;
  attention: number;
  disabled: number;
}

export interface IntegrationsDashboard {
  generatedAt: string;
  summary: IntegrationSummary;
  integrations: IntegrationStatus[];
}
