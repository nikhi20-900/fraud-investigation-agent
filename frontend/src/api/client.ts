import type {
  CaseSummary,
  CaseDetail,
  InvestigationRequest,
  InvestigationResponse,
  HealthResponse,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Fallback seed data in case backend server is temporarily unreached
const FALLBACK_CASES: CaseDetail[] = [
  {
    id: 'CASE-1001',
    title: 'High-Velocity Card Testing Pattern',
    customer_id: 'CUST-8842',
    status: 'IN_REVIEW',
    risk_level: 'CRITICAL',
    risk_score: 0.94,
    flagged_amount: 14850.0,
    currency: 'USD',
    created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    summary: 'Rapid sequence of 18 transactions across 4 foreign merchants in under 6 minutes.',
    description: 'Account flagged due to rapid succession of e-commerce card authorizations originated via dynamic residential proxies in Eastern Europe, followed by two large wire requests to offshore crypto exchanges.',
    assigned_investigator: 'Sarah Chen (L2 Analyst)',
    tags: ['Card Testing', 'Velocity Spike', 'Crypto Off-ramp', 'Proxy IP'],
    ai_hypothesis: 'Likely automated bot-driven card testing script utilizing credential stuffing, targeting compromised checkout gateways before triggering large volume fund sweeps.',
    recommended_actions: [
      'Freeze linked debit card ending in 9041',
      'Block IP cluster 198.51.100.0/24 at firewall boundary',
      'Request immediate step-up biometric MFA on account login',
      'Notify payment network interchange fraud desk',
    ],
    transactions: [
      {
        id: 'TXN-901',
        timestamp: new Date(Date.now() - 3.1 * 3600 * 1000).toISOString(),
        amount: 1.25,
        currency: 'USD',
        merchant: 'Apex Digital Goods (E-Store)',
        location: 'Bucharest, RO',
        flag_reason: 'Micro-authorization probe',
      },
      {
        id: 'TXN-902',
        timestamp: new Date(Date.now() - 3.05 * 3600 * 1000).toISOString(),
        amount: 2.5,
        currency: 'USD',
        merchant: 'Nordic Stream Media',
        location: 'Vilnius, LT',
        flag_reason: 'Micro-authorization probe',
      },
      {
        id: 'TXN-903',
        timestamp: new Date(Date.now() - 3.0 * 3600 * 1000).toISOString(),
        amount: 7400.0,
        currency: 'USD',
        merchant: 'BitVault OTC Desk',
        location: 'Valletta, MT',
        flag_reason: 'Abnormal high-value crypto purchase',
      },
    ],
    nodes: [
      { id: 'CUST-8842', type: 'Customer', label: 'Customer: Johnathan Vance', risk_score: 0.94, properties: { country: 'US', tenure_months: 14 } },
      { id: 'ACC-4091', type: 'Account', label: 'Checking Acc *4091', risk_score: 0.91, properties: { tier: 'Premier', balance: 1820.0 } },
      { id: 'DEV-8812', type: 'Device', label: 'Android Emulator (Pixel 6)', risk_score: 0.98, properties: { rooted: true, fingerprint_spoofed: true } },
      { id: 'IP-198-51', type: 'IP', label: '198.51.100.88 (Proxy/VPN)', risk_score: 0.99, properties: { asn: 'AS64498', country: 'NL' } },
      { id: 'MERCH-BV', type: 'Merchant', label: 'BitVault OTC Desk', risk_score: 0.76, properties: { category: 'Crypto Exchange' } },
      { id: 'CARD-9041', type: 'Card', label: 'Visa Platinum *9041', risk_score: 0.95, properties: { cvv_retry_count: 5 } },
    ],
    edges: [
      { source: 'CUST-8842', target: 'ACC-4091', relationship: 'OWNS', weight: 1.0 },
      { source: 'ACC-4091', target: 'CARD-9041', relationship: 'USES_CARD', weight: 1.0 },
      { source: 'ACC-4091', target: 'DEV-8812', relationship: 'USES_DEVICE', weight: 0.95 },
      { source: 'ACC-4091', target: 'IP-198-51', relationship: 'CONNECTED_FROM', weight: 0.99 },
      { source: 'ACC-4091', target: 'MERCH-BV', relationship: 'MADE', weight: 0.88 },
    ],
  },
];

export async function fetchHealth(): Promise<{ online: boolean; data?: HealthResponse }> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, { method: 'GET' });
    if (res.ok) {
      const data = await res.json();
      return { online: true, data };
    }
  } catch (err) {
    // Backend offline
  }
  return { online: false };
}

export async function fetchCases(filters?: {
  status?: string;
  risk_level?: string;
  search?: string;
}): Promise<CaseSummary[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.risk_level) params.append('risk_level', filters.risk_level);
    if (filters?.search) params.append('search', filters.search);

    const res = await fetch(`${API_BASE_URL}/api/cases?${params.toString()}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend unavailable, using fallback fixtures for cases.');
  }

  let result = FALLBACK_CASES;
  if (filters?.status) {
    result = result.filter((c) => c.status === filters.status);
  }
  if (filters?.risk_level) {
    result = result.filter((c) => c.risk_level === filters.risk_level);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (c) =>
        c.id.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.customer_id.toLowerCase().includes(q)
    );
  }
  return result;
}

export async function fetchCaseById(caseId: string): Promise<CaseDetail | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/cases/${caseId}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn(`Backend unavailable for case ${caseId}, using fallback fixtures.`);
  }

  const found = FALLBACK_CASES.find((c) => c.id.toUpperCase() === caseId.toUpperCase());
  return found || FALLBACK_CASES[0];
}

export async function triggerInvestigation(
  payload: InvestigationRequest
): Promise<InvestigationResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/investigations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend unavailable, generating client fallback response for investigation.');
  }

  return {
    investigation_id: `INV-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
    case_id: payload.case_id,
    status: 'queued',
    started_at: new Date().toISOString(),
    message: `Investigation dispatched locally for ${payload.case_id}.`,
    investigation_type: payload.investigation_type,
    preview_findings: [
      `Queued automated pipeline for ${payload.case_id}.`,
      `Graph exploration configured up to ${payload.max_graph_hops ?? 2} hops.`,
      `Reasoning agent scheduled. (Phase 1 Placeholder)`,
    ],
  };
}

// ==============================================================================
// PHASE 2: TIGERGRAPH GSQL CLIENT API
// ==============================================================================

export interface GraphSummaryResponse {
  metadata: Record<string, any>;
  scenarios: Array<{
    name: string;
    description: string;
    [key: string]: any;
  }>;
  vertex_counts: Record<string, number>;
  edge_counts: Record<string, number>;
}

export async function fetchGraphSummary(): Promise<GraphSummaryResponse | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/graph/summary`);
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Backend unavailable for graph summary.');
  }
  return null;
}

export async function fetchAccountNeighborhood(accountId: string, maxHops: number = 2): Promise<any> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/graph/neighborhood/${accountId}?max_hops=${maxHops}`);
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn(`Error fetching neighborhood for ${accountId}`);
  }
  return null;
}

export async function fetchSharedDevices(minAccounts: number = 2): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/graph/shared-devices?min_accounts=${minAccounts}`);
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Error fetching shared devices');
  }
  return [];
}

export async function fetchSharedIps(minAccounts: number = 2): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/graph/shared-ips?min_accounts=${minAccounts}`);
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Error fetching shared ips');
  }
  return [];
}

export async function fetchConnectedAccounts(accountId: string): Promise<any> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/graph/connected-accounts/${accountId}`);
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn(`Error fetching connected accounts for ${accountId}`);
  }
  return null;
}

export async function fetchTransactionPaths(accountId: string, maxDepth: number = 3): Promise<any> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/graph/transaction-paths/${accountId}?max_depth=${maxDepth}`);
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn(`Error fetching transaction paths for ${accountId}`);
  }
  return null;
}

export async function fetchMerchantRelationships(merchantId: string): Promise<any> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/graph/merchant-relationships/${merchantId}`);
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn(`Error fetching merchant relationships for ${merchantId}`);
  }
  return null;
}

// ==============================================================================
// PHASE 3: FRAUD PATTERN DETECTION CLIENT API
// ==============================================================================

export interface FraudFindingItem {
  pattern: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  confidence: number;
  entities: string[];
  evidence: Array<{ rule: string; detail: string; metrics?: Record<string, any> }>;
  explanation: string;
}

export interface AccountAnalysisData {
  account_id: string;
  analyzed_at: string;
  total_findings: number;
  highest_severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  findings: FraudFindingItem[];
  summary: string;
}

export interface CaseFindingsData {
  case_id: string;
  analyzed_at: string;
  target_accounts: string[];
  total_findings: number;
  highest_severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  findings: FraudFindingItem[];
  summary: string;
}

export async function fetchAccountFraudPatterns(accountId: string): Promise<AccountAnalysisData | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/fraud/patterns/${accountId}`);
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn(`Error fetching fraud patterns for ${accountId}`);
  }
  return null;
}

export async function fetchCaseFraudFindings(caseId: string): Promise<CaseFindingsData | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/fraud/findings/${caseId}`);
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn(`Error fetching case findings for ${caseId}`);
  }
  return null;
}

// ==============================================================================
// PHASE 4: AGENTIC INVESTIGATION CLIENT API
// ==============================================================================

export interface AgentInvestigationReport {
  investigation_id: string;
  case_id?: string;
  target_account_id?: string;
  status: string;
  summary: string;
  findings: FraudFindingItem[];
  evidence: Array<{
    rule: string;
    detail: string;
    pattern?: string;
    severity?: string;
    confidence?: number;
    metrics?: Record<string, any>;
  }>;
  hypotheses: Array<{
    id: string;
    statement: string;
    status: string;
    confidence: number;
    rationale?: string;
  }>;
  uncertainties: string[];
  next_actions: string[];
}

export async function triggerAgentInvestigation(payload: {
  case_id?: string;
  account_id?: string;
  analyst_notes?: string;
}): Promise<AgentInvestigationReport | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/agent/investigate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn('Error running agent investigation', err);
  }
  return null;
}

export async function fetchAgentInvestigation(investigationId: string): Promise<AgentInvestigationReport | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/agent/investigations/${investigationId}`);
    if (res.ok) return await res.json();
  } catch (err) {
    console.warn(`Error fetching investigation ${investigationId}`, err);
  }
  return null;
}
