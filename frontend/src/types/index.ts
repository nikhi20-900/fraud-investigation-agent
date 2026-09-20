// ==============================================================================
// FRAUD INVESTIGATION AGENT - SHARED TYPES (PHASES 1 - 7)
// ==============================================================================

// --- Phase 1: Foundation & Cases ---
export type CaseStatus =
  | 'NEW'
  | 'IN_REVIEW'
  | 'ESCALATED'
  | 'RESOLVED_FRAUD'
  | 'CLOSED_FALSE_POSITIVE';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface FlaggedTransaction {
  id: string;
  timestamp: string;
  amount: number;
  currency: string;
  merchant: string;
  location: string;
  flag_reason: string;
}

export interface EntityNode {
  id: string;
  type: string;
  label: string;
  risk_score: number;
  properties: Record<string, any>;
}

export interface EntityEdge {
  source: string;
  target: string;
  relationship: string;
  weight?: number;
}

export interface CaseSummary {
  id: string;
  title: string;
  customer_id: string;
  status: CaseStatus;
  risk_level: RiskLevel;
  risk_score: number;
  flagged_amount: number;
  currency: string;
  created_at: string;
  updated_at: string;
  summary: string;
  tags: string[];
}

export interface CaseDetail extends CaseSummary {
  description: string;
  assigned_investigator?: string;
  transactions: FlaggedTransaction[];
  nodes: EntityNode[];
  edges: EntityEdge[];
  ai_hypothesis?: string;
  recommended_actions: string[];
}

export type InvestigationType =
  | 'initial_triage'
  | 'deep_dive'
  | 'graph_expansion'
  | 'agentic_reasoning';

export interface InvestigationRequest {
  case_id: string;
  investigation_type: InvestigationType;
  analyst_notes?: string;
  max_graph_hops?: number;
}

export interface InvestigationResponse {
  investigation_id: string;
  case_id: string;
  status: string;
  started_at: string;
  message: string;
  investigation_type: InvestigationType;
  preview_findings: string[];
}

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  timestamp: string;
}

// --- Phase 2: Graph Telemetry ---
export interface GraphEntity {
  id: string;
  _type: 'Customer' | 'Account' | 'Device' | 'IP' | 'Transaction' | 'Merchant' | string;
  name?: string;
  label?: string;
  account_number?: string;
  device_type?: string;
  is_emulator?: boolean;
  ip_address?: string;
  is_proxy_vpn?: boolean;
  amount?: number;
  country?: string;
  risk_tier?: string;
  properties?: Record<string, any>;
}

export interface GraphRelationship {
  source: string;
  target: string;
  type: string;
  timestamp?: string;
  amount?: number;
}

export interface GraphNeighborhoodResponse {
  account_id: string;
  total_nodes: number;
  total_edges: number;
  nodes: GraphEntity[];
  edges: GraphRelationship[];
}

// --- Phase 3: Pattern Detection ---
export interface EvidenceItem {
  rule: string;
  detail: string;
  pattern?: string;
  severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence?: number;
  metrics?: Record<string, any>;
}

export interface FraudFinding {
  pattern: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;
  confidence_meaning?: string;
  entities: string[];
  evidence: EvidenceItem[];
  explanation: string;
}

export interface AccountAnalysisResult {
  account_id: string;
  analyzed_at: string;
  total_findings: number;
  highest_severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  findings: FraudFinding[];
  summary: string;
}

// --- Phase 4: Agentic Forensic Reasoner ---
export interface Hypothesis {
  id: string;
  statement: string;
  status: 'SUPPORTED' | 'REFUTED' | 'UNRESOLVED';
  confidence: number;
  rationale?: string;
}

export interface AuditEvent {
  step: string;
  details: string;
  timestamp?: string;
}

export interface AgentInvestigationReport {
  investigation_id: string;
  case_id?: string;
  target_account_id?: string;
  status: string;
  summary: string;
  findings: FraudFinding[];
  evidence: EvidenceItem[];
  hypotheses: Hypothesis[];
  uncertainties: string[];
  next_actions: string[];
  audit_trail?: AuditEvent[];
}

// --- Phase 5: Risk & Uncertainty Engine ---
export type RiskTier = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type UncertaintyTier = 'LOW' | 'MEDIUM' | 'HIGH';
export type RiskQuadrant =
  | 'HIGH_RISK_LOW_UNCERTAINTY'
  | 'HIGH_RISK_HIGH_UNCERTAINTY'
  | 'LOW_RISK_LOW_UNCERTAINTY'
  | 'LOW_RISK_HIGH_UNCERTAINTY';

export interface RiskFactor {
  factor_id: string;
  name: string;
  source: string;
  pattern?: string;
  rule?: string;
  severity: string;
  evidence_strength: number;
  score_contribution: number;
  impact_category: string;
  entities: string[];
  mitigating: boolean;
  explanation: string;
}

export interface UncertaintyAssessment {
  uncertainty_score: number;
  uncertainty_tier: UncertaintyTier;
  coverage_score: number;
  quadrant: RiskQuadrant;
  factors: string[];
  blind_spots: string[];
}

export interface RiskAssessment {
  account_id: string;
  case_id?: string;
  risk_score: number;
  risk_tier: RiskTier;
  risk_factors: RiskFactor[];
  uncertainty: UncertaintyAssessment;
  evidence_coverage: number;
  explanation: string;
  assessed_at: string;
}

// --- Phase 6: Next Best Action Engine ---
export type ActionType =
  | 'REQUEST_DEVICE_TELEMETRY'
  | 'INVESTIGATE_SHARED_IP'
  | 'INVESTIGATE_SHARED_DEVICE'
  | 'TRACE_TRANSACTION_CHAIN'
  | 'REVIEW_MERCHANT_RELATIONSHIP'
  | 'REVIEW_ACCOUNT_CONNECTIONS'
  | 'REQUEST_KYC_REVERIFICATION'
  | 'EXPAND_TRANSACTION_HISTORY'
  | 'REVIEW_VELOCITY_ACTIVITY'
  | 'INVESTIGATE_COUNTERPARTY'
  | 'COLLECT_MISSING_EVIDENCE'
  | 'MANUAL_ANALYST_REVIEW';

export type ActionPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface InvestigationAction {
  action_id: string;
  action_type: ActionType;
  title: string;
  description: string;
  priority: ActionPriority;
  priority_score: number;
  reason: string;
  supporting_evidence: string[];
  target_entities: string[];
  expected_information: string;
  uncertainty_reduction: number;
  risk_relevance: number;
  preconditions: string[];
  status: string;
}

export interface ActionPlan {
  account_id: string;
  case_id?: string;
  risk_score: number;
  risk_tier: string;
  uncertainty_score: number;
  uncertainty_tier: string;
  quadrant: string;
  recommended_actions: InvestigationAction[];
  explanation: string;
  generated_at: string;
}
