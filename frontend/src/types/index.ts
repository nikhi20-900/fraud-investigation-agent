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
