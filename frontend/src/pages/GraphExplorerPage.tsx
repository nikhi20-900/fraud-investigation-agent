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
        return <User className="w-4 h-4 text-purple-600" />;
      case 'account':
        return <Building2 className="w-4 h-4 text-blue-600" />;
      case 'device':
        return <Smartphone className="w-4 h-4 text-teal-600" />;
      case 'ip':
        return <Globe className="w-4 h-4 text-orange-600" />;
      case 'merchant':
        return <ShieldAlert className="w-4 h-4 text-pink-600" />;
      default:
        return <CreditCard className="w-4 h-4 text-green-600" />;
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
    <div className="p-8 space-y-6 max-w-7xl mx-auto text-gray-900">
      {/* Top Banner with TigerGraph Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-gray-200/60 rounded-2xl p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-600">
              Phase 2 Graph Intelligence
            </span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              TigerGraph GSQL Engine Ready
            </span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight mt-1">
            Graph Topology & Entity Relationship Explorer
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Graph: <span className="font-mono text-purple-600 font-semibold">FraudNetworkGraph</span> • 7 Vertices ({graphSummary ? Object.values(graphSummary.vertex_counts).reduce((a, b) => a + b, 0) : '131'} records) • 7 Edges ({graphSummary ? Object.values(graphSummary.edge_counts).reduce((a, b) => a + b, 0) : '143'} relationships)
          </p>
        </div>

        {/* Quick Scenario Picker */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">Scenarios:</span>
          <select
            onChange={(e) => handleScenarioPick(e.target.value)}
            className="bg-gray-100 border border-transparent rounded-lg px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:bg-white focus:border-blue-400 transition-all"
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
      <div className="bg-white border border-gray-200/60 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="bg-gray-100 rounded-lg p-0.5 flex flex-wrap gap-0.5">
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
              className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-all ${
                activeQuery === tab.id
                  ? 'bg-white text-gray-900 font-semibold shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
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
              className="bg-gray-100 border border-transparent rounded-lg px-3 py-1.5 text-xs text-gray-800 font-mono focus:outline-none focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all w-48"
            />
            <button
              onClick={runQuery}
              className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
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
        <div className="lg:col-span-2 bg-white border border-gray-200/60 rounded-2xl p-6 shadow-xs relative min-h-[520px] flex flex-col justify-between overflow-hidden">
          {/* Canvas Sub-Header */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Share2 className="w-3.5 h-3.5 text-blue-600" />
              <span>GSQL Execution Output</span>
            </div>
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-md bg-purple-50 border border-purple-200/60 text-purple-700">
              {getGsqlPreview()}
            </span>
          </div>

          {/* Results Display */}
          <div className="relative z-10 my-6 flex-1">
            {loading ? (
              <div className="h-64 flex items-center justify-center text-xs text-gray-400">
                Executing GSQL query...
              </div>
            ) : activeQuery === 'shared_devices' ? (
              /* Shared Devices List */
              <div className="space-y-3">
                {(queryResult || []).map((dev: any) => (
                  <div
                    key={dev.device_id}
                    onClick={() => setSelectedNode(dev)}
                    className="p-4 rounded-xl bg-gray-50 border border-gray-200/60 hover:border-teal-400/60 cursor-pointer transition-all space-y-2 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                          <Smartphone className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-gray-900 font-mono">{dev.device_id}</div>
                          <div className="text-[11px] text-gray-500">
                            {dev.device_type} • {dev.is_emulator ? 'Rooted Emulator' : 'Physical'}
                          </div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 text-xs font-mono font-medium">
                        {dev.account_count} Accounts Connected
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-200/60">
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider">Shared By:</span>
                      {dev.account_ids.map((acc: string) => (
                        <span key={acc} className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-white text-blue-600 border border-gray-200">
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
                    className="p-4 rounded-xl bg-gray-50 border border-gray-200/60 hover:border-orange-400/60 cursor-pointer transition-all space-y-2 shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                          <Globe className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-gray-900 font-mono">{ip.ip_address}</div>
                          <div className="text-[11px] text-gray-500">
                            {ip.ip_id} • Country: {ip.country} • {ip.is_proxy_vpn ? 'Anomalous Proxy/VPN' : 'Direct'}
                          </div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 text-xs font-mono font-medium">
                        {ip.account_count} Accounts Connected
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-200/60">
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider">Originating Accounts:</span>
                      {ip.account_ids.map((acc: string) => (
                        <span key={acc} className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-white text-orange-700 border border-gray-200">
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
                <div className="text-xs text-gray-600">
                  Target Account: <span className="font-mono font-semibold text-blue-600">{queryResult?.seed_account_id}</span> ({queryResult?.total_connections || 0} 2-hop entity links found)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(queryResult?.connections || []).map((conn: any, i: number) => (
                    <div key={i} className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/60 space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-mono font-semibold text-gray-900">{conn.target_account_id}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200/60">
                          via {conn.shared_entity_type}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-400 font-mono truncate">
                        Entity: {conn.shared_entity_id}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : activeQuery === 'transaction_paths' ? (
              /* Transaction Paths */
              <div className="space-y-4">
                <div className="text-xs text-gray-600">
                  Multi-hop Fund Flow Chains originating from <span className="font-mono font-semibold text-blue-600">{targetId}</span>:
                </div>
                <div className="space-y-2 font-mono text-xs">
                  {(queryResult?.paths || []).map((p: any, i: number) => (
                    <div key={i} className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/60 text-gray-800">
                      <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Path #{i + 1}</div>
                      {p.join(' -> ')}
                    </div>
                  ))}
                </div>
              </div>
            ) : activeQuery === 'merchant_relationships' ? (
              /* Merchant Relationships */
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/60">
                    <div className="text-[11px] uppercase text-gray-400 font-medium">Total Volume</div>
                    <div className="text-base font-semibold text-gray-900 font-mono mt-1">
                      ${queryResult?.total_volume_usd?.toLocaleString() || '0'} USD
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/60">
                    <div className="text-[11px] uppercase text-gray-400 font-medium">Transactions</div>
                    <div className="text-base font-semibold text-gray-900 font-mono mt-1">
                      {queryResult?.transaction_count || 0}
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/60">
                    <div className="text-[11px] uppercase text-gray-400 font-medium">Unique Accounts</div>
                    <div className="text-base font-semibold text-red-600 font-mono mt-1">
                      {queryResult?.unique_account_count || 0}
                    </div>
                  </div>
                </div>

                <div className="text-xs font-semibold text-gray-700">Connected Accounts:</div>
                <div className="flex flex-wrap gap-1.5">
                  {(queryResult?.account_ids || []).map((acc: string) => (
                    <span key={acc} className="px-2 py-1 rounded-md bg-gray-100 border border-gray-200 text-xs font-mono text-blue-600">
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
                          ? 'bg-blue-50 border-blue-400 shadow-xs'
                          : 'bg-gray-50 border-gray-200/60 hover:bg-gray-100/70'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="w-7 h-7 rounded-lg bg-white border border-gray-200/60 flex items-center justify-center">
                          {getNodeIcon(node._type)}
                        </div>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white border border-gray-200 text-gray-500">
                          {node._type}
                        </span>
                      </div>
                      <div className="font-semibold text-xs text-gray-900 truncate">
                        {node.name || node.label || node.account_number || node.id}
                      </div>
                      <div className="text-[10px] text-gray-400 font-mono truncate">{node.id}</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Canvas Footer */}
          <div className="relative z-10 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
            <span>Query: {activeQuery}</span>
            <span className="text-blue-600 font-mono font-medium">
              Nodes: {queryResult?.nodes?.length || queryResult?.total_nodes || 0}
            </span>
          </div>
        </div>

        {/* Right 1 Col: Vertex Inspector & GSQL Runner */}
        <div className="space-y-6">
          {/* Vertex Inspector */}
          <div className="bg-white border border-gray-200/60 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-900">Vertex Telemetry</h3>
              </div>
              {selectedNode && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200/60">
                  {selectedNode._type || selectedNode.device_type || 'Entity'}
                </span>
              )}
            </div>

            {selectedNode ? (
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-400">Primary ID</div>
                  <div className="text-sm font-semibold text-gray-900 font-mono mt-0.5">
                    {selectedNode.id || selectedNode.device_id || selectedNode.ip_id}
                  </div>
                </div>

                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Synthetic Attributes
                </div>
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-200/60 space-y-1.5 font-mono text-xs max-h-60 overflow-y-auto">
                  {Object.entries(selectedNode)
                    .filter(([k]) => !k.startsWith('_'))
                    .map(([k, v]) => (
                      <div key={k} className="flex justify-between gap-2">
                        <span className="text-gray-400">{k}:</span>
                        <span className="text-gray-800 truncate max-w-[160px]">{String(v)}</span>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              <div className="text-xs text-gray-400 py-12 text-center">
                Click any vertex or query result to inspect telemetry.
              </div>
            )}
          </div>

          {/* TigerGraph Deployment Info */}
          <div className="bg-white border border-gray-200/60 rounded-2xl p-6 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-purple-600" />
              <h3 className="text-sm font-semibold text-gray-900">Target: TigerGraph</h3>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Target Graph: <code className="text-purple-600 font-semibold">FraudNetworkGraph</code>
              <br />
              Loading Job: <code className="text-gray-700">graph/load_data.gsql</code>
              <br />
              Active Target: <span className="text-emerald-600 font-medium">In-Memory Simulator Fallback</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
