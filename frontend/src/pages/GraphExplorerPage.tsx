import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Database,
  Info,
  User,
  CreditCard,
  Building2,
  Smartphone,
  Globe,
  Share2,
  Play,
  ShieldAlert,
} from 'lucide-react';
import {
  fetchGraphSummary,
  fetchAccountNeighborhood,
  fetchSharedDevices,
  fetchSharedIps,
  fetchConnectedAccounts,
  fetchTransactionPaths,
  fetchMerchantRelationships,
} from '../api/client';
import type { GraphSummaryResponse } from '../api/client';

type QueryType =
  | 'neighborhood'
  | 'shared_devices'
  | 'shared_ips'
  | 'connected_accounts'
  | 'transaction_paths'
  | 'merchant_relationships';

export const GraphExplorerPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = (searchParams.get('query') as QueryType) || 'neighborhood';
  const initialTarget = searchParams.get('target') || 'ACC-RING-001';

  const [graphSummary, setGraphSummary] = useState<GraphSummaryResponse | null>(null);
  const [activeQuery, setActiveQuery] = useState<QueryType>(initialQuery);
  const [targetId, setTargetId] = useState<string>(initialTarget);
  const [queryResult, setQueryResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<any>(null);

  // Load summary on mount
  useEffect(() => {
    fetchGraphSummary().then((data) => {
      if (data) setGraphSummary(data);
    });
  }, []);

  // Execute active query
  const runQuery = async () => {
    setLoading(true);
    try {
      let data = null;
      if (activeQuery === 'neighborhood') {
        data = await fetchAccountNeighborhood(targetId || 'ACC-RING-001', 2);
      } else if (activeQuery === 'shared_devices') {
        data = await fetchSharedDevices(2);
      } else if (activeQuery === 'shared_ips') {
        data = await fetchSharedIps(2);
      } else if (activeQuery === 'connected_accounts') {
        data = await fetchConnectedAccounts(targetId || 'ACC-RING-001');
      } else if (activeQuery === 'transaction_paths') {
        data = await fetchTransactionPaths(targetId || 'ACC-CHAIN-SOURCE-501', 3);
      } else if (activeQuery === 'merchant_relationships') {
        data = await fetchMerchantRelationships(targetId || 'MERCH-CRYPTO-COLLUSION-99');
      }
      setQueryResult(data);
      if (data?.nodes && data.nodes.length > 0) {
        setSelectedNode(data.nodes[0]);
      } else {
        setSelectedNode(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runQuery();
    setSearchParams({ query: activeQuery, target: targetId });
  }, [activeQuery]);

  const handleScenarioPick = (scenarioName: string) => {
    if (scenarioName.includes('Shared Device')) {
      setActiveQuery('shared_devices');
      setTargetId('ACC-RING-001');
    } else if (scenarioName.includes('IP Proxy')) {
      setActiveQuery('shared_ips');
      setTargetId('ACC-PROXY-001');
    } else if (scenarioName.includes('Layering')) {
      setActiveQuery('transaction_paths');
      setTargetId('ACC-CHAIN-SOURCE-501');
    } else if (scenarioName.includes('Merchant')) {
      setActiveQuery('merchant_relationships');
      setTargetId('MERCH-CRYPTO-COLLUSION-99');
    } else {
      setActiveQuery('neighborhood');
      setTargetId('ACC-NORM-001');
    }
  };

  const getNodeIcon = (type: string) => {
    switch ((type || '').toLowerCase()) {
      case 'customer':
        return <User className="w-4 h-4 text-indigo-400" />;
      case 'account':
        return <Building2 className="w-4 h-4 text-blue-400" />;
      case 'device':
        return <Smartphone className="w-4 h-4 text-amber-400" />;
      case 'ip':
        return <Globe className="w-4 h-4 text-rose-400" />;
      case 'merchant':
        return <ShieldAlert className="w-4 h-4 text-purple-400" />;
      default:
        return <CreditCard className="w-4 h-4 text-emerald-400" />;
    }
  };

  const getGsqlPreview = () => {
    switch (activeQuery) {
      case 'neighborhood':
        return `RUN QUERY account_neighborhood("${targetId}", 2)`;
      case 'shared_devices':
        return `RUN QUERY find_shared_devices(2)`;
      case 'shared_ips':
        return `RUN QUERY find_shared_ips(2)`;
      case 'connected_accounts':
        return `RUN QUERY find_connected_accounts("${targetId}")`;
      case 'transaction_paths':
        return `RUN QUERY trace_transaction_paths("${targetId}", 3)`;
      case 'merchant_relationships':
        return `RUN QUERY get_merchant_relationships("${targetId}")`;
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner with TigerGraph Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">
              Phase 2 Graph Intelligence
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              TigerGraph GSQL Engine Ready
            </span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1">
            Graph Topology & Entity Relationship Explorer
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Graph: <span className="font-mono text-purple-300 font-semibold">FraudNetworkGraph</span> • 7 Vertices ({graphSummary ? Object.values(graphSummary.vertex_counts).reduce((a, b) => a + b, 0) : '131'} records) • 7 Edges ({graphSummary ? Object.values(graphSummary.edge_counts).reduce((a, b) => a + b, 0) : '143'} relationships)
          </p>
        </div>

        {/* Quick Scenario Picker */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Scenarios:</span>
          <select
            onChange={(e) => handleScenarioPick(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="Scenario 2">Scenario 2: Shared Device Ring</option>
            <option value="Scenario 3">Scenario 3: IP Proxy Cluster</option>
            <option value="Scenario 4">Scenario 4: Merchant Collusion</option>
            <option value="Scenario 5">Scenario 5: Multi-hop Layering</option>
            <option value="Scenario 1">Scenario 1: Normal Baseline</option>
          </select>
        </div>
      </div>

      {/* Query Selector Tabs */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'neighborhood', label: '1. Account Neighborhood' },
            { id: 'shared_devices', label: '2. Shared Devices' },
            { id: 'shared_ips', label: '3. Shared IPs' },
            { id: 'connected_accounts', label: '4. Connected Accounts' },
            { id: 'transaction_paths', label: '5. Transaction Paths' },
            { id: 'merchant_relationships', label: '6. Merchant Analysis' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveQuery(tab.id as QueryType)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeQuery === tab.id
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'bg-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Target input if query needs seed */}
        {(activeQuery === 'neighborhood' ||
          activeQuery === 'connected_accounts' ||
          activeQuery === 'transaction_paths' ||
          activeQuery === 'merchant_relationships') && (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              placeholder="Seed Target ID..."
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-indigo-500 w-48"
            />
            <button
              onClick={runQuery}
              className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
              title="Run Query"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
            </button>
          </div>
        )}
      </div>

      {/* Main Canvas & Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Query Results Visual Canvas */}
        <div className="lg:col-span-2 bg-slate-950/80 border border-slate-800/80 rounded-2xl p-6 shadow-xl relative min-h-[520px] flex flex-col justify-between overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

          {/* Canvas Sub-Header */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Share2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>GSQL Execution Output</span>
            </div>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-purple-300">
              {getGsqlPreview()}
            </span>
          </div>

          {/* Results Display */}
          <div className="relative z-10 my-6 flex-1">
            {loading ? (
              <div className="h-64 flex items-center justify-center text-xs text-slate-400">
                Executing GSQL query...
              </div>
            ) : activeQuery === 'shared_devices' ? (
              /* Shared Devices List */
              <div className="space-y-3">
                {(queryResult || []).map((dev: any) => (
                  <div
                    key={dev.device_id}
                    onClick={() => setSelectedNode(dev)}
                    className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/50 cursor-pointer transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                          <Smartphone className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white font-mono">{dev.device_id}</div>
                          <div className="text-[11px] text-slate-400">
                            {dev.device_type} • {dev.is_emulator ? 'Rooted Emulator' : 'Physical'}
                          </div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-500/40 text-xs font-mono font-bold">
                        {dev.account_count} Accounts Connected
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800/80">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">Shared By:</span>
                      {dev.account_ids.map((acc: string) => (
                        <span key={acc} className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300">
                          {acc}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : activeQuery === 'shared_ips' ? (
              /* Shared IPs List */
              <div className="space-y-3">
                {(queryResult || []).map((ip: any) => (
                  <div
                    key={ip.ip_id}
                    onClick={() => setSelectedNode(ip)}
                    className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-rose-500/50 cursor-pointer transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                          <Globe className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white font-mono">{ip.ip_address}</div>
                          <div className="text-[11px] text-slate-400">
                            {ip.ip_id} • Country: {ip.country} • {ip.is_proxy_vpn ? 'Anomalous Proxy/VPN' : 'Direct'}
                          </div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-500/40 text-xs font-mono font-bold">
                        {ip.account_count} Accounts Connected
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800/80">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">Originating Accounts:</span>
                      {ip.account_ids.map((acc: string) => (
                        <span key={acc} className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-rose-300">
                          {acc}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : activeQuery === 'connected_accounts' ? (
              /* Connected Accounts */
              <div className="space-y-3">
                <div className="text-xs text-slate-300">
                  Target Account: <span className="font-mono font-bold text-indigo-300">{queryResult?.seed_account_id}</span> ({queryResult?.total_connections || 0} 2-hop entity links found)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(queryResult?.connections || []).map((conn: any, i: number) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-mono font-bold text-white">{conn.target_account_id}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                          via {conn.shared_entity_type}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono truncate">
                        Entity: {conn.shared_entity_id}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : activeQuery === 'transaction_paths' ? (
              /* Transaction Paths */
              <div className="space-y-4">
                <div className="text-xs text-slate-300">
                  Multi-hop Fund Flow Chains originating from <span className="font-mono font-bold text-indigo-300">{targetId}</span>:
                </div>
                <div className="space-y-2 font-mono text-xs">
                  {(queryResult?.paths || []).map((p: any, i: number) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-200">
                      <div className="text-[10px] uppercase text-slate-500 font-bold mb-1">Path #{i + 1}</div>
                      {p.join(' -> ')}
                    </div>
                  ))}
                </div>
              </div>
            ) : activeQuery === 'merchant_relationships' ? (
              /* Merchant Relationships */
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-[10px] uppercase text-slate-400 font-bold">Total Volume</div>
                    <div className="text-base font-bold text-white font-mono mt-1">
                      ${queryResult?.total_volume_usd?.toLocaleString() || '0'} USD
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-[10px] uppercase text-slate-400 font-bold">Transactions</div>
                    <div className="text-base font-bold text-white font-mono mt-1">
                      {queryResult?.transaction_count || 0}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                    <div className="text-[10px] uppercase text-slate-400 font-bold">Unique Accounts</div>
                    <div className="text-base font-bold text-rose-400 font-mono mt-1">
                      {queryResult?.unique_account_count || 0}
                    </div>
                  </div>
                </div>

                <div className="text-xs font-semibold text-slate-300">Connected Accounts:</div>
                <div className="flex flex-wrap gap-1.5">
                  {(queryResult?.account_ids || []).map((acc: string) => (
                    <span key={acc} className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-xs font-mono text-indigo-300">
                      {acc}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              /* Neighborhood Node Grid */
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {(queryResult?.nodes || []).map((node: any) => {
                  const isSelected = selectedNode?.id === node.id;
                  return (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      className={`p-3.5 rounded-xl cursor-pointer transition-all border ${
                        isSelected
                          ? 'bg-indigo-950/80 border-indigo-500 shadow-lg shadow-indigo-500/20'
                          : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center">
                          {getNodeIcon(node._type)}
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          {node._type}
                        </span>
                      </div>
                      <div className="font-semibold text-xs text-white truncate">
                        {node.name || node.label || node.account_number || node.id}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono truncate">{node.id}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Canvas Footer */}
          <div className="relative z-10 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>Query: {activeQuery}</span>
            <span className="text-indigo-400 font-mono">
              Nodes: {queryResult?.nodes?.length || queryResult?.total_nodes || 0}
            </span>
          </div>
        </div>

        {/* Right 1 Col: Vertex Inspector & GSQL Runner */}
        <div className="space-y-6">
          {/* Vertex Inspector */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Vertex Telemetry</h3>
              </div>
              {selectedNode && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {selectedNode._type || selectedNode.device_type || 'Entity'}
                </span>
              )}
            </div>

            {selectedNode ? (
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-slate-400">Primary ID</div>
                  <div className="text-sm font-bold text-white font-mono mt-0.5">
                    {selectedNode.id || selectedNode.device_id || selectedNode.ip_id}
                  </div>
                </div>

                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Synthetic Attributes
                </div>
                <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800 space-y-1.5 font-mono text-xs max-h-60 overflow-y-auto">
                  {Object.entries(selectedNode)
                    .filter(([k]) => !k.startsWith('_'))
                    .map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-2">
                        <span className="text-slate-400">{k}:</span>
                        <span className="text-slate-200 truncate max-w-[160px]">{String(v)}</span>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-400 py-12 text-center">
                Click any vertex or query result to inspect telemetry.
              </div>
            )}
          </div>

          {/* TigerGraph Deployment Info */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xl space-y-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white">Target: TigerGraph</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Target Graph: <code className="text-purple-300">FraudNetworkGraph</code>
              <br />
              Loading Job: <code className="text-slate-300">graph/load_data.gsql</code>
              <br />
              Active Target: <span className="text-emerald-400 font-medium">In-Memory Simulator Fallback</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
