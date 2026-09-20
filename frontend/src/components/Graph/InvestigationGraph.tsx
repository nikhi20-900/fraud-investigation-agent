import React, { useState, useMemo, useRef } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Info,
  CreditCard,
  User,
  Smartphone,
  Globe,
  ArrowRightLeft,
  Building2,
  Layers,
  X,
} from 'lucide-react';
import type { GraphEntity, GraphRelationship } from '../../types';

interface InvestigationGraphProps {
  nodes: GraphEntity[];
  edges: GraphRelationship[];
  targetAccountId?: string;
  selectedNodeId?: string | null;
  onSelectNode?: (node: GraphEntity) => void;
  loading?: boolean;
}

interface Point {
  x: number;
  y: number;
}

export const InvestigationGraph: React.FC<InvestigationGraphProps> = ({
  nodes,
  edges,
  targetAccountId,
  selectedNodeId,
  onSelectNode,
  loading = false,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<Point>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<Point>({ x: 0, y: 0 });
  const [internalSelected, setInternalSelected] = useState<GraphEntity | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Synchronize external selectedNodeId
  const activeSelected = useMemo(() => {
    if (selectedNodeId) {
      return nodes.find((n) => n.id === selectedNodeId) || internalSelected;
    }
    return internalSelected;
  }, [selectedNodeId, internalSelected, nodes]);

  // Node Type styling config
  const getNodeConfig = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'account':
        return {
          fill: '#4f46e5', // indigo-600
          stroke: '#818cf8', // indigo-400
          textColor: '#c7d2fe',
          icon: CreditCard,
          label: 'Account',
          radius: 26,
        };
      case 'customer':
        return {
          fill: '#059669', // emerald-600
          stroke: '#34d399', // emerald-400
          textColor: '#a7f3d0',
          icon: User,
          label: 'Customer',
          radius: 24,
        };
      case 'device':
        return {
          fill: '#d97706', // amber-600
          stroke: '#fbbf24', // amber-400
          textColor: '#fde68a',
          icon: Smartphone,
          label: 'Device',
          radius: 22,
        };
      case 'ip':
        return {
          fill: '#0891b2', // cyan-600
          stroke: '#22d3ee', // cyan-400
          textColor: '#a5f3fc',
          icon: Globe,
          label: 'IP',
          radius: 22,
        };
      case 'transaction':
        return {
          fill: '#e11d48', // rose-600
          stroke: '#fb7185', // rose-400
          textColor: '#fecdd3',
          icon: ArrowRightLeft,
          label: 'Transaction',
          radius: 22,
        };
      case 'merchant':
        return {
          fill: '#9333ea', // purple-600
          stroke: '#c084fc', // purple-400
          textColor: '#e9d5ff',
          icon: Building2,
          label: 'Merchant',
          radius: 24,
        };
      default:
        return {
          fill: '#475569', // slate-600
          stroke: '#94a3b8', // slate-400
          textColor: '#cbd5e1',
          icon: Layers,
          label: 'Entity',
          radius: 20,
        };
    }
  };

  // Layout node coordinates deterministically in concentric layout
  const nodePositions = useMemo(() => {
    const positions = new Map<string, Point>();
    if (!nodes || nodes.length === 0) return positions;

    const width = 800;
    const height = 500;
    const centerX = width / 2;
    const centerY = height / 2;

    const primaryId = targetAccountId || nodes[0]?.id;
    positions.set(primaryId, { x: centerX, y: centerY });

    const otherNodes = nodes.filter((n) => n.id !== primaryId);
    if (otherNodes.length === 0) return positions;

    // Group other nodes by type for organized radial placement
    const groups: { [type: string]: GraphEntity[] } = {};
    otherNodes.forEach((n) => {
      const t = n._type || 'Other';
      if (!groups[t]) groups[t] = [];
      groups[t].push(n);
    });

    const totalOthers = otherNodes.length;
    let radius = 180;
    if (totalOthers > 12) radius = 230;

    let currentIndex = 0;
    // Iterate each group and distribute radially
    Object.keys(groups).forEach((type) => {
      const grp = groups[type];
      grp.forEach((node) => {
        const angle = (currentIndex / totalOthers) * 2 * Math.PI - Math.PI / 2;
        // Introduce small alternating distance to avoid angular overlap
        const r = radius + (currentIndex % 2 === 0 ? 25 : -25);
        positions.set(node.id, {
          x: centerX + r * Math.cos(angle),
          y: centerY + r * Math.sin(angle),
        });
        currentIndex++;
      });
    });

    return positions;
  }, [nodes, targetAccountId]);

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click for pan
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => setZoom((z) => Math.min(2.5, z + 0.2));
  const handleZoomOut = () => setZoom((z) => Math.max(0.4, z - 0.2));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const handleNodeClick = (node: GraphEntity, e: React.MouseEvent) => {
    e.stopPropagation();
    setInternalSelected(node);
    if (onSelectNode) {
      onSelectNode(node);
    }
  };

  return (
    <div className="relative bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
      {/* Top Header / Toolbar */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur border border-slate-800 px-3 py-1.5 rounded-xl shadow-lg pointer-events-auto">
          <Layers className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-bold text-white tracking-wide">
            Investigation Graph
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
            {nodes.length} Nodes • {edges.length} Edges
          </span>
        </div>

        {/* Zoom & Reset Controls */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 backdrop-blur border border-slate-800 p-1 rounded-xl shadow-lg pointer-events-auto">
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
            title="Reset View"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`w-full h-[480px] select-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        <svg
          viewBox="0 0 800 500"
          className="w-full h-full"
          style={{
            backgroundImage:
              'radial-gradient(circle at 50% 50%, rgba(30, 41, 59, 0.4) 0%, rgba(2, 6, 23, 0.9) 100%)',
          }}
        >
          <defs>
            <marker
              id="arrow"
              viewBox="0 -5 10 10"
              refX="32"
              refY="0"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M0,-5L10,0L0,5" fill="#64748b" />
            </marker>
            <marker
              id="arrow-active"
              viewBox="0 -5 10 10"
              refX="32"
              refY="0"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M0,-5L10,0L0,5" fill="#818cf8" />
            </marker>
          </defs>

          {/* Root Transform Group for Pan & Zoom */}
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* Edges */}
            {edges.map((edge, idx) => {
              const srcPt = nodePositions.get(edge.source);
              const tgtPt = nodePositions.get(edge.target);
              if (!srcPt || !tgtPt) return null;

              const isIncident =
                activeSelected &&
                (activeSelected.id === edge.source || activeSelected.id === edge.target);

              const midX = (srcPt.x + tgtPt.x) / 2;
              const midY = (srcPt.y + tgtPt.y) / 2;

              return (
                <g key={`edge-${idx}`}>
                  <line
                    x1={srcPt.x}
                    y1={srcPt.y}
                    x2={tgtPt.x}
                    y2={tgtPt.y}
                    stroke={isIncident ? '#818cf8' : '#334155'}
                    strokeWidth={isIncident ? 2.5 : 1.5}
                    strokeDasharray={edge.type.includes('SHARED') ? '4 3' : undefined}
                    markerEnd={isIncident ? 'url(#arrow-active)' : 'url(#arrow)'}
                    className="transition-all duration-300"
                  />
                  {/* Edge Label */}
                  {edge.type && (
                    <text
                      x={midX}
                      y={midY - 4}
                      fill={isIncident ? '#a5b4fc' : '#64748b'}
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="middle"
                      className="select-none pointer-events-none"
                    >
                      {edge.type.replace(/_/g, ' ')}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {nodes.map((node) => {
              const pt = nodePositions.get(node.id);
              if (!pt) return null;

              const config = getNodeConfig(node._type);
              const isTarget = node.id === targetAccountId;
              const isSelected = activeSelected?.id === node.id;
              const radius = isTarget ? config.radius + 4 : config.radius;

              return (
                <g
                  key={`node-${node.id}`}
                  transform={`translate(${pt.x}, ${pt.y})`}
                  onClick={(e) => handleNodeClick(node, e)}
                  className="cursor-pointer transition-transform duration-200"
                >
                  {/* Outer pulse/ring for selected or target node */}
                  {isSelected && (
                    <circle
                      r={radius + 8}
                      fill="none"
                      stroke="#818cf8"
                      strokeWidth="2.5"
                      strokeDasharray="4 3"
                      className="animate-spin-slow"
                    />
                  )}
                  {isTarget && !isSelected && (
                    <circle
                      r={radius + 6}
                      fill="none"
                      stroke="#4f46e5"
                      strokeWidth="1.5"
                      opacity="0.8"
                    />
                  )}

                  {/* Node Circle */}
                  <circle
                    r={radius}
                    fill={config.fill}
                    stroke={isSelected ? '#ffffff' : config.stroke}
                    strokeWidth={isSelected ? 3 : 2}
                    filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.5))"
                  />

                  {/* Node Type Text */}
                  <text
                    y={-radius - 8}
                    fill={config.textColor}
                    fontSize="9"
                    fontWeight="bold"
                    fontFamily="sans-serif"
                    textAnchor="middle"
                    className="select-none"
                  >
                    {config.label}
                  </text>

                  {/* Node Name/ID Label */}
                  <text
                    y={radius + 14}
                    fill="#e2e8f0"
                    fontSize="10"
                    fontWeight="600"
                    fontFamily="monospace"
                    textAnchor="middle"
                    className="select-none"
                  >
                    {node.name || node.label || node.account_number || node.id}
                  </text>
                  <text
                    y={radius + 25}
                    fill="#94a3b8"
                    fontSize="8"
                    fontFamily="monospace"
                    textAnchor="middle"
                    className="select-none"
                  >
                    {node.id}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* Empty or Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <div className="text-xs text-slate-300 font-medium">Rendering Neighborhood Graph...</div>
            </div>
          </div>
        )}

        {nodes.length === 0 && !loading && (
          <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-xs">
            No graph entities available for this target.
          </div>
        )}
      </div>

      {/* Floating Selected Node Inspector Panel */}
      {activeSelected && (
        <div className="absolute bottom-4 right-4 z-20 w-80 max-w-[calc(100%-2rem)] bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-xl p-4 shadow-2xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Entity Telemetry
              </span>
            </div>
            <button
              onClick={() => setInternalSelected(null)}
              className="text-slate-400 hover:text-white p-1 rounded transition-colors"
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-800">
              <span className="text-slate-400">Entity Type:</span>
              <span className="font-semibold text-indigo-300 font-mono">
                {activeSelected._type || 'Entity'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-800">
              <span className="text-slate-400">ID:</span>
              <span className="font-mono text-white text-[11px] truncate max-w-[170px]" title={activeSelected.id}>
                {activeSelected.id}
              </span>
            </div>
            {activeSelected.name && (
              <div className="flex justify-between items-center py-1 border-b border-slate-800">
                <span className="text-slate-400">Name:</span>
                <span className="text-slate-200 font-medium">{activeSelected.name}</span>
              </div>
            )}
            {activeSelected.device_type && (
              <div className="flex justify-between items-center py-1 border-b border-slate-800">
                <span className="text-slate-400">Device Type:</span>
                <span className="text-amber-300 font-mono">{activeSelected.device_type}</span>
              </div>
            )}
            {activeSelected.is_emulator !== undefined && (
              <div className="flex justify-between items-center py-1 border-b border-slate-800">
                <span className="text-slate-400">Emulator Detected:</span>
                <span className={`font-mono font-bold ${activeSelected.is_emulator ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {activeSelected.is_emulator ? 'YES' : 'NO'}
                </span>
              </div>
            )}
            {activeSelected.is_proxy_vpn !== undefined && (
              <div className="flex justify-between items-center py-1 border-b border-slate-800">
                <span className="text-slate-400">Proxy / VPN:</span>
                <span className={`font-mono font-bold ${activeSelected.is_proxy_vpn ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {activeSelected.is_proxy_vpn ? 'YES' : 'NO'}
                </span>
              </div>
            )}
            {activeSelected.risk_tier && (
              <div className="flex justify-between items-center py-1 border-b border-slate-800">
                <span className="text-slate-400">Risk Tier:</span>
                <span className="font-mono text-amber-300 font-semibold">{activeSelected.risk_tier}</span>
              </div>
            )}
            {activeSelected.amount !== undefined && (
              <div className="flex justify-between items-center py-1 border-b border-slate-800">
                <span className="text-slate-400">Amount:</span>
                <span className="font-mono text-white">${activeSelected.amount.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
