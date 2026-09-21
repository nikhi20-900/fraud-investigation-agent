import React, { useState, useEffect, useCallback } from 'react';
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
  Network,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
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

export type QueryType =
  | 'neighborhood'
  | 'shared_devices'
  | 'shared_ips'
  | 'connected_accounts'
  | 'transaction_paths'
  | 'merchant_relationships';

export const normalizeQueryType = (raw?: string | null): QueryType | null => {
  if (!raw) return null;
  const q = raw.toLowerCase().trim().replace(/-/g, '_');
  if (q === 'shared_devices' || q === 'shared_device' || q === 'devices' || q === 'device') {
    return 'shared_devices';
  }
  if (q === 'shared_ips' || q === 'shared_ip' || q === 'ips' || q === 'ip' || q === 'proxy' || q === 'proxies') {
    return 'shared_ips';
  }
  if (q === 'connected_accounts' || q === 'connected_account' || q === 'connected') {
    return 'connected_accounts';
  }
  if (q === 'transaction_paths' || q === 'transaction_path' || q === 'paths' || q === 'layering') {
    return 'transaction_paths';
  }
  if (q === 'merchant_relationships' || q === 'merchant_relationship' || q === 'merchant' || q === 'collusion') {
    return 'merchant_relationships';
  }
  if (q === 'neighborhood' || q === 'account_neighborhood' || q === 'seed') {
    return 'neighborhood';
  }
  return null;
};

export const GraphExplorerPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawQuery = searchParams.get('query');
  const rawTarget = searchParams.get('target');

  const normalizedInitialQuery = normalizeQueryType(rawQuery);
  const [activeQuery, setActiveQuery] = useState<QueryType | null>(normalizedInitialQuery);
  const [targetId, setTargetId] = useState<string>(rawTarget || 'ACC-RING-001');

  const [graphSummary, setGraphSummary] = useState<GraphSummaryResponse | null>(null);
  const [queryResult, setQueryResult] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);

  // 1. Load summary on mount
  useEffect(() => {
    fetchGraphSummary().then((data) => {
      if (data) setGraphSummary(data);
    });
  }, []);

  // 2. Synchronize URL query/target params into component state
  useEffect(() => {
    const currentQuery = normalizeQueryType(searchParams.get('query'));
    const currentTarget = searchParams.get('target');

    if (currentQuery !== activeQuery) {
      setActiveQuery(currentQuery);
    }
    if (currentTarget && currentTarget !== targetId) {
      setTargetId(currentTarget);
    }
  }, [searchParams]);

  // 3. Query executor
  const executeQuery = useCallback(async (query: QueryType | null, target: string) => {
    if (!query) {
      setQueryResult(null);
      setSelectedNode(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      let data: any = null;
      if (query === 'neighborhood') {
        data = await fetchAccountNeighborhood(target || 'ACC-RING-001', 2);
      } else if (query === 'shared_devices') {
        data = await fetchSharedDevices(2);
      } else if (query === 'shared_ips') {
        data = await fetchSharedIps(2);
      } else if (query === 'connected_accounts') {
        data = await fetchConnectedAccounts(target || 'ACC-RING-001');
      } else if (query === 'transaction_paths') {
        data = await fetchTransactionPaths(target || 'ACC-CHAIN-SOURCE-501', 3);
      } else if (query === 'merchant_relationships') {
        data = await fetchMerchantRelationships(target || 'MERCH-CRYPTO-COLLUSION-99');
      }

      setQueryResult(data);

      // Auto-select first item for telemetry inspector
      if (Array.isArray(data) && data.length > 0) {
        setSelectedNode(data[0]);
      } else if (data?.nodes && data.nodes.length > 0) {
        setSelectedNode(data.nodes[0]);
      } else {
        setSelectedNode(null);
      }
    } catch (err: any) {
      console.error('GSQL execution error:', err);
      setError(err?.message || 'Failed to retrieve graph data from TigerGraph engine.');
      setQueryResult(null);
      setSelectedNode(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // 4. Trigger query when activeQuery or targetId changes
  useEffect(() => {
    if (activeQuery) {
      executeQuery(activeQuery, targetId);
    } else {
      setQueryResult(null);
      setSelectedNode(null);
      setLoading(false);
    }
  }, [activeQuery, targetId, executeQuery]);

  const handleSelectQuery = (query: QueryType) => {
    setActiveQuery(query);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('query', query.replace(/_/g, '-'));
    if (targetId) {
      nextParams.set('target', targetId);
    }
    setSearchParams(nextParams);
  };

  const handleScenarioPick = (scenarioName: string) => {
    let nextQ: QueryType = 'neighborhood';
    let nextTarget = 'ACC-NORM-001';

    if (scenarioName.includes('Shared Device')) {
      nextQ = 'shared_devices';
      nextTarget = 'ACC-RING-001';
    } else if (scenarioName.includes('IP Proxy')) {
      nextQ = 'shared_ips';
      nextTarget = 'ACC-PROXY-001';
    } else if (scenarioName.includes('Layering')) {
      nextQ = 'transaction_paths';
      nextTarget = 'ACC-CHAIN-SOURCE-501';
    } else if (scenarioName.includes('Merchant')) {
      nextQ = 'merchant_relationships';
      nextTarget = 'MERCH-CRYPTO-COLLUSION-99';
    }

    setActiveQuery(nextQ);
    setTargetId(nextTarget);
    setSearchParams({
      query: nextQ.replace(/_/g, '-'),
      target: nextTarget,
    });
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
        return `RUN QUERY account_neighborhood("${targetId || 'ACC-RING-001'}", 2)`;
      case 'shared_devices':
        return `RUN QUERY find_shared_devices(2)`;
      case 'shared_ips':
        return `RUN QUERY find_shared_ips(2)`;
      case 'connected_accounts':
        return `RUN QUERY find_connected_accounts("${targetId || 'ACC-RING-001'}")`;
      case 'transaction_paths':
        return `RUN QUERY trace_transaction_paths("${targetId || 'ACC-CHAIN-SOURCE-501'}", 3)`;
      case 'merchant_relationships':
        return `RUN QUERY get_merchant_relationships("${targetId || 'MERCH-CRYPTO-COLLUSION-99'}")`;
      default:
        return 'GSQL ENGINE READY — SELECT QUERY';
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
            Graph: <span className="font-mono text-purple-600 font-semibold">FraudNetworkGraph</span> • 7 Vertices ({graphSummary ? Object.values(graphSummary.vertex_counts).reduce((a, b) => a + b, 0) : '133'} records) • 7 Edges ({graphSummary ? Object.values(graphSummary.edge_counts).reduce((a, b) => a + b, 0) : '147'} relationships)
          </p>
        </div>

        {/* Quick Scenario Picker */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 font-medium">Scenarios:</span>
          <select
            onChange={(e) => handleScenarioPick(e.target.value)}
            className="bg-gray-100 border border-transparent rounded-lg px-3 py-1.5 text-xs text-gray-800 focus:outline-none focus:bg-white focus:border-blue-400 transition-all"
            value={
              activeQuery === 'shared_devices'
                ? 'Scenario 2'
                : activeQuery === 'shared_ips'
                ? 'Scenario 3'
                : activeQuery === 'merchant_relationships'
                ? 'Scenario 4'
                : activeQuery === 'transaction_paths'
                ? 'Scenario 5'
                : 'Scenario 1'
            }
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
            { id: 'neighborhood' as QueryType, label: '1. Account Neighborhood' },
            { id: 'shared_devices' as QueryType, label: '2. Shared Devices' },
            { id: 'shared_ips' as QueryType, label: '3. Shared IPs' },
            { id: 'connected_accounts' as QueryType, label: '4. Connected Accounts' },
            { id: 'transaction_paths' as QueryType, label: '5. Transaction Paths' },
            { id: 'merchant_relationships' as QueryType, label: '6. Merchant Analysis' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleSelectQuery(tab.id)}
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
              onClick={() => executeQuery(activeQuery, targetId)}
              disabled={loading}
              className="p-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors disabled:opacity-50"
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

          {/* Results Display Area */}
          <div className="relative z-10 my-6 flex-1">
            {/* 1. Loading State */}
            {loading ? (
              <div className="py-24 flex flex-col items-center justify-center space-y-3 text-center">
                <div className="w-8 h-8 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
                <div className="text-xs text-gray-500 font-medium">Executing GSQL graph traversal query...</div>
              </div>
            ) : error ? (
              /* 2. Error State */
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 space-y-2">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                  <span>Query Execution Failed</span>
                </div>
                <p className="text-red-600 leading-relaxed">{error}</p>
                <button
                  onClick={() => executeQuery(activeQuery, targetId)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-red-300 text-red-700 hover:bg-red-50 font-medium inline-flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Query</span>
                </button>
              </div>
            ) : !activeQuery ? (
              /* 3. Empty State / Query Catalog (when directly visiting /graph) */
              <div className="py-6 space-y-6">
                <div className="text-center space-y-1.5 max-w-lg mx-auto">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto shadow-xs">
                    <Network className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 tracking-tight">
                    Select a Graph Investigation Query
                  </h3>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    Explore TigerGraph network topology across device rings, anomalous proxy IPs, multi-hop money muling cascades, and merchant collusion.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                  <button
                    onClick={() => handleSelectQuery('shared_devices')}
                    className="p-4 rounded-xl bg-gray-50 border border-gray-200/80 hover:border-teal-400 hover:bg-teal-50/40 text-left transition-all group space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-mono text-teal-700 group-hover:translate-x-0.5 transition-transform flex items-center gap-1 font-semibold">
                        Execute <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-900">Shared Device Rings</div>
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        Detect physical & emulated hardware fingerprints shared by multiple accounts.
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSelectQuery('shared_ips')}
                    className="p-4 rounded-xl bg-gray-50 border border-gray-200/80 hover:border-orange-400 hover:bg-orange-50/40 text-left transition-all group space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                        <Globe className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-mono text-orange-700 group-hover:translate-x-0.5 transition-transform flex items-center gap-1 font-semibold">
                        Execute <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-900">Shared IP & Proxy Clusters</div>
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        Find anomalous datacenter proxies and VPN egress nodes connecting accounts.
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSelectQuery('neighborhood')}
                    className="p-4 rounded-xl bg-gray-50 border border-gray-200/80 hover:border-blue-400 hover:bg-blue-50/40 text-left transition-all group space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-mono text-blue-700 group-hover:translate-x-0.5 transition-transform flex items-center gap-1 font-semibold">
                        Execute <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-900">Account Neighborhood (2 Hops)</div>
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        Traverse 2 hops from seed account across Cards, Devices, IPs, and Customers.
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSelectQuery('connected_accounts')}
                    className="p-4 rounded-xl bg-gray-50 border border-gray-200/80 hover:border-purple-400 hover:bg-purple-50/40 text-left transition-all group space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                        <Network className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-mono text-purple-700 group-hover:translate-x-0.5 transition-transform flex items-center gap-1 font-semibold">
                        Execute <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-900">2-Hop Connected Accounts</div>
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        Detect accounts connected via 2-hop hardware or network entity sharing.
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSelectQuery('transaction_paths')}
                    className="p-4 rounded-xl bg-gray-50 border border-gray-200/80 hover:border-indigo-400 hover:bg-indigo-50/40 text-left transition-all group space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        <Share2 className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-mono text-indigo-700 group-hover:translate-x-0.5 transition-transform flex items-center gap-1 font-semibold">
                        Execute <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-900">Multi-Hop Layering Chains</div>
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        Trace multi-hop fund flow routing and money muling transaction paths.
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => handleSelectQuery('merchant_relationships')}
                    className="p-4 rounded-xl bg-gray-50 border border-gray-200/80 hover:border-pink-400 hover:bg-pink-50/40 text-left transition-all group space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-8 h-8 rounded-lg bg-pink-50 text-pink-600 flex items-center justify-center">
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-mono text-pink-700 group-hover:translate-x-0.5 transition-transform flex items-center gap-1 font-semibold">
                        Execute <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-900">Merchant Bust-Out Analysis</div>
                      <div className="text-[11px] text-gray-500 mt-0.5">
                        Analyze transaction volume, velocity, and syndicate accounts targeting merchants.
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            ) : activeQuery === 'shared_devices' ? (
              /* 4. Shared Devices List */
              !queryResult || queryResult.length === 0 ? (
                <div className="py-20 text-center space-y-2">
                  <Smartphone className="w-8 h-8 text-gray-400 mx-auto" />
                  <div className="text-xs font-semibold text-gray-800">No Shared Devices Detected</div>
                  <p className="text-[11px] text-gray-500 max-w-sm mx-auto">
                    No hardware fingerprints shared across 2 or more accounts were detected.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {queryResult.map((dev: any) => {
                    const isSelected = selectedNode?.device_id === dev.device_id;
                    return (
                      <div
                        key={dev.device_id}
                        onClick={() => setSelectedNode(dev)}
                        className={`p-4 rounded-xl cursor-pointer transition-all space-y-2 shadow-xs border ${
                          isSelected
                            ? 'bg-teal-50/60 border-teal-500 ring-1 ring-teal-500/20'
                            : 'bg-gray-50 border-gray-200/60 hover:border-teal-400/60'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center">
                              <Smartphone className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-semibold text-gray-900 font-mono">{dev.device_id}</div>
                              <div className="text-[11px] text-gray-500">
                                {dev.device_type} • {dev.is_emulator ? 'Rooted Emulator' : 'Physical Device'}
                              </div>
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 text-xs font-mono font-medium">
                            {dev.account_count} Accounts Connected
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-200/60 items-center">
                          <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Shared By:</span>
                          {dev.account_ids.map((acc: string) => (
                            <span key={acc} className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-white text-blue-600 border border-gray-200 font-medium">
                              {acc}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : activeQuery === 'shared_ips' ? (
              /* 5. Shared IPs List */
              !queryResult || queryResult.length === 0 ? (
                <div className="py-20 text-center space-y-2">
                  <Globe className="w-8 h-8 text-gray-400 mx-auto" />
                  <div className="text-xs font-semibold text-gray-800">No Shared IP Clusters Detected</div>
                  <p className="text-[11px] text-gray-500 max-w-sm mx-auto">
                    No network addresses connecting 2 or more accounts were detected.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {queryResult.map((ip: any) => {
                    const isSelected = selectedNode?.ip_id === ip.ip_id;
                    return (
                      <div
                        key={ip.ip_id}
                        onClick={() => setSelectedNode(ip)}
                        className={`p-4 rounded-xl cursor-pointer transition-all space-y-2 shadow-xs border ${
                          isSelected
                            ? 'bg-orange-50/60 border-orange-500 ring-1 ring-orange-500/20'
                            : 'bg-gray-50 border-gray-200/60 hover:border-orange-400/60'
                        }`}
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
                        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-200/60 items-center">
                          <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Originating Accounts:</span>
                          {ip.account_ids.map((acc: string) => (
                            <span key={acc} className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-white text-orange-700 border border-gray-200 font-medium">
                              {acc}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            ) : activeQuery === 'connected_accounts' ? (
              /* 6. Connected Accounts */
              !queryResult?.connections || queryResult.connections.length === 0 ? (
                <div className="py-20 text-center space-y-2">
                  <Network className="w-8 h-8 text-gray-400 mx-auto" />
                  <div className="text-xs font-semibold text-gray-800">No 2-Hop Connected Accounts Found</div>
                  <p className="text-[11px] text-gray-500 max-w-sm mx-auto">
                    Account {targetId} does not share devices, cards, or IP addresses with any other accounts.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-xs text-gray-600">
                    Target Account: <span className="font-mono font-semibold text-blue-600">{queryResult?.seed_account_id}</span> ({queryResult?.total_connections || 0} 2-hop entity links found)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {queryResult.connections.map((conn: any, i: number) => (
                      <div key={i} className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/60 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-mono font-semibold text-gray-900">{conn.target_account_id}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200/60 font-medium">
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
              )
            ) : activeQuery === 'transaction_paths' ? (
              /* 7. Transaction Paths */
              !queryResult?.paths || queryResult.paths.length === 0 ? (
                <div className="py-20 text-center space-y-2">
                  <Share2 className="w-8 h-8 text-gray-400 mx-auto" />
                  <div className="text-xs font-semibold text-gray-800">No Multi-Hop Transaction Paths Found</div>
                  <p className="text-[11px] text-gray-500 max-w-sm mx-auto">
                    No outbound transfer chains originating from account {targetId} up to 3 hops.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-xs text-gray-600">
                    Multi-hop Fund Flow Chains originating from <span className="font-mono font-semibold text-blue-600">{targetId}</span>:
                  </div>
                  <div className="space-y-2 font-mono text-xs">
                    {queryResult.paths.map((p: any, i: number) => (
                      <div key={i} className="p-3.5 rounded-xl bg-gray-50 border border-gray-200/60 text-gray-800">
                        <div className="text-[10px] uppercase text-gray-400 font-semibold mb-1">Path #{i + 1}</div>
                        {p.join(' -> ')}
                      </div>
                    ))}
                  </div>
                </div>
              )
            ) : activeQuery === 'merchant_relationships' ? (
              /* 8. Merchant Relationships */
              !queryResult || queryResult.transaction_count === 0 ? (
                <div className="py-20 text-center space-y-2">
                  <ShieldAlert className="w-8 h-8 text-gray-400 mx-auto" />
                  <div className="text-xs font-semibold text-gray-800">No Merchant Transaction Data</div>
                  <p className="text-[11px] text-gray-500 max-w-sm mx-auto">
                    No transactions paid to merchant {targetId} recorded in the graph.
                  </p>
                </div>
              ) : (
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
              )
            ) : (
              /* 9. Neighborhood Node Grid */
              !queryResult?.nodes || queryResult.nodes.length === 0 ? (
                <div className="py-20 text-center space-y-2">
                  <Building2 className="w-8 h-8 text-gray-400 mx-auto" />
                  <div className="text-xs font-semibold text-gray-800">No Neighborhood Nodes Found</div>
                  <p className="text-[11px] text-gray-500 max-w-sm mx-auto">
                    Account {targetId} does not have adjacent entities within 2 hops.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {queryResult.nodes.map((node: any) => {
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
              )
            )}
          </div>

          {/* Canvas Footer */}
          <div className="relative z-10 pt-4 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
            <span>Query: {activeQuery || 'None selected'}</span>
            <span className="text-blue-600 font-mono font-medium">
              Results: {Array.isArray(queryResult) ? queryResult.length : (queryResult?.nodes?.length || queryResult?.total_nodes || queryResult?.total_connections || queryResult?.path_count || 0)}
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
                <h3 className="text-sm font-semibold text-gray-900">Entity Telemetry</h3>
              </div>
              {selectedNode && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border border-gray-200/60">
                  {selectedNode._type || selectedNode.device_type || (selectedNode.is_proxy_vpn !== undefined ? 'IP' : 'Entity')}
                </span>
              )}
            </div>

            {selectedNode ? (
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-400">Primary ID</div>
                  <div className="text-sm font-semibold text-gray-900 font-mono mt-0.5">
                    {selectedNode.id || selectedNode.device_id || selectedNode.ip_id || selectedNode.target_account_id}
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
                        <span className="text-gray-800 truncate max-w-[160px]">
                          {Array.isArray(v) ? v.join(', ') : String(v)}
                        </span>
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
