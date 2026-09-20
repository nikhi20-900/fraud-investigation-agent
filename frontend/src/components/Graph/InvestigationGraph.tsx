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

  // Node Type styling config (Apple muted pastel palette)
  const getNodeConfig = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'account':
        return {
          fill: '#DBEAFE', // blue-100
          stroke: '#2563EB', // blue-600
          textColor: '#1E40AF',
          icon: CreditCard,
          label: 'Account',
          radius: 26,
        };
      case 'customer':
        return {
          fill: '#F3E8FF', // purple-100
          stroke: '#9333EA', // purple-600
          textColor: '#6B21A8',
          icon: User,
          label: 'Customer',
          radius: 24,
        };
      case 'device':
        return {
          fill: '#CCFBF1', // teal-100
          stroke: '#0D9488', // teal-600
          textColor: '#115E59',
          icon: Smartphone,
          label: 'Device',
          radius: 22,
        };
      case 'ip':
        return {
          fill: '#FFEDD5', // orange-100
          stroke: '#EA580C', // orange-600
          textColor: '#9A3412',
          icon: Globe,
          label: 'IP',
          radius: 22,
        };
      case 'transaction':
        return {
          fill: '#DCFCE7', // green-100
          stroke: '#16A34A', // green-600
          textColor: '#166534',
          icon: ArrowRightLeft,
          label: 'Transaction',
          radius: 22,
        };
      case 'merchant':
        return {
          fill: '#FCE7F3', // pink-100
          stroke: '#DB2777', // pink-600
          textColor: '#9D174D',
          icon: Building2,
          label: 'Merchant',
          radius: 24,
        };
      default:
        return {
          fill: '#F3F4F6', // gray-100
          stroke: '#6B7280', // gray-500
          textColor: '#374151',
          icon: Layers,
          label: 'Entity',
          radius: 20,
        };
    }
  };

  // Layout node coordinates deterministically in multi-orbit concentric layout
  const nodePositions = useMemo(() => {
    const positions = new Map<string, Point>();
    if (!nodes || nodes.length === 0) return positions;

    const width = 900;
    const height = 540;
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
    let currentIndex = 0;

    // Distribute nodes across staggered concentric orbits when > 8 nodes
    Object.keys(groups).forEach((type) => {
      const grp = groups[type];
      grp.forEach((node) => {
        let r = 180;
        if (totalOthers <= 8) {
          r = 175;
        } else if (totalOthers <= 16) {
          // 2 staggered concentric orbits
          r = currentIndex % 2 === 0 ? 155 : 235;
        } else {
          // 3 staggered orbits for 17-25+ dense graph scenarios
          r = currentIndex % 3 === 0 ? 145 : currentIndex % 3 === 1 ? 215 : 275;
        }

        const angle = (currentIndex / totalOthers) * 2 * Math.PI - Math.PI / 2;
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
    <div className="relative bg-white border border-gray-200/60 rounded-2xl overflow-hidden shadow-sm">
      {/* Top Header / Toolbar */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur border border-gray-200/60 px-3 py-1.5 rounded-lg shadow-xs pointer-events-auto">
          <Layers className="w-4 h-4 text-blue-600" />
          <span className="text-[13px] font-semibold text-gray-900 tracking-tight">
            Investigation Graph
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gray-100 text-gray-600">
            {nodes.length} Nodes • {edges.length} Edges
          </span>
        </div>

        {/* Zoom & Reset Controls */}
        <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 shadow-sm p-1 pointer-events-auto">
          <button
            onClick={handleZoomIn}
            className="p-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleReset}
            className="p-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
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
        className={`w-full h-[480px] select-none bg-[#F5F5F7] ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        <svg
          viewBox="0 0 900 540"
          className="w-full h-full"
        >
          <defs>
            <pattern id="dot-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="#E5E5EA" />
            </pattern>
            <marker
              id="arrow"
              viewBox="0 -5 10 10"
              refX="30"
              refY="0"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M0,-4L8,0L0,4" fill="#9CA3AF" />
            </marker>
            <marker
              id="arrow-active"
              viewBox="0 -5 10 10"
              refX="30"
              refY="0"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M0,-4L8,0L0,4" fill="#2563EB" />
            </marker>
          </defs>

          <rect width="100%" height="100%" fill="#F5F5F7" />
          <rect width="100%" height="100%" fill="url(#dot-grid)" />

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
                    stroke={isIncident ? '#2563EB' : '#D1D5DB'}
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
                      fill={isIncident ? '#1D4ED8' : '#6B7280'}
                      fontSize="9"
                      fontFamily="monospace"
                      textAnchor="middle"
                      className="select-none pointer-events-none font-medium"
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
                  {/* Outer ring for selected or target node */}
                  {isSelected && (
                    <circle
                      r={radius + 7}
                      fill="none"
                      stroke="#2563EB"
                      strokeWidth="2.5"
                      strokeDasharray="4 3"
                    />
                  )}
                  {isTarget && !isSelected && (
                    <circle
                      r={radius + 5}
                      fill="none"
                      stroke="#3B82F6"
                      strokeWidth="1.5"
                      opacity="0.7"
                    />
                  )}

                  {/* Node Circle */}
                  <circle
                    r={radius}
                    fill={config.fill}
                    stroke={isSelected ? '#2563EB' : config.stroke}
                    strokeWidth={isSelected ? 3 : 2}
                    filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.06))"
                  />

                  {/* Node Type Text */}
                  <text
                    y={-radius - 7}
                    fill={config.textColor}
                    fontSize="9"
                    fontWeight="600"
                    fontFamily="sans-serif"
                    textAnchor="middle"
                    className="select-none"
                  >
                    {config.label}
                  </text>

                  {/* Node Primary Label */}
                  <text
                    y={radius + 14}
                    fill="#1F2937"
                    fontSize="11"
                    fontWeight="600"
                    fontFamily="monospace"
                    textAnchor="middle"
                    className="select-none"
                  >
                    {(() => {
                      const display = node.name || node.label || node.account_number || node.id;
                      return display.length > 18 ? `${display.slice(0, 16)}…` : display;
                    })()}
                  </text>
                  {/* Secondary ID only if primary display was a distinct name */}
                  {(node.name || node.label || node.account_number) &&
                    (node.name || node.label || node.account_number) !== node.id && (
                      <text
                        y={radius + 25}
                        fill="#6B7280"
                        fontSize="9"
                        fontFamily="monospace"
                        textAnchor="middle"
                        className="select-none"
                      >
                        {node.id.length > 18 ? `${node.id.slice(0, 16)}…` : node.id}
                      </text>
                    )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* Empty or Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <div className="text-xs text-gray-700 font-medium">Rendering Neighborhood Graph...</div>
            </div>
          </div>
        )}

        {nodes.length === 0 && !loading && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs">
            No graph entities available for this target.
          </div>
        )}
      </div>

      {/* Floating Selected Node Inspector Panel */}
      {activeSelected && (
        <div className="absolute bottom-4 right-4 z-20 w-80 max-w-[calc(100%-2rem)] bg-white/95 backdrop-blur-md border border-gray-200/80 rounded-xl p-4 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-600" />
              <span className="text-[11px] font-semibold text-gray-900 uppercase tracking-wider">
                Entity Telemetry
              </span>
            </div>
            <button
              onClick={() => setInternalSelected(null)}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors"
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between items-center py-1 border-b border-gray-100">
              <span className="text-gray-500">Entity Type:</span>
              <span className="font-semibold text-blue-600 font-mono">
                {activeSelected._type || 'Entity'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-gray-100">
              <span className="text-gray-500">ID:</span>
              <span className="font-mono text-gray-900 text-[11px] truncate max-w-[170px]" title={activeSelected.id}>
                {activeSelected.id}
              </span>
            </div>
            {activeSelected.name && (
              <div className="flex justify-between items-center py-1 border-b border-gray-100">
                <span className="text-gray-500">Name:</span>
                <span className="text-gray-800 font-medium">{activeSelected.name}</span>
              </div>
            )}
            {activeSelected.device_type && (
              <div className="flex justify-between items-center py-1 border-b border-gray-100">
                <span className="text-gray-500">Device Type:</span>
                <span className="text-teal-700 font-mono">{activeSelected.device_type}</span>
              </div>
            )}
            {activeSelected.is_emulator !== undefined && (
              <div className="flex justify-between items-center py-1 border-b border-gray-100">
                <span className="text-gray-500">Emulator Detected:</span>
                <span className={`font-mono font-semibold ${activeSelected.is_emulator ? 'text-red-600' : 'text-green-600'}`}>
                  {activeSelected.is_emulator ? 'YES' : 'NO'}
                </span>
              </div>
            )}
            {activeSelected.is_proxy_vpn !== undefined && (
              <div className="flex justify-between items-center py-1 border-b border-gray-100">
                <span className="text-gray-500">Proxy / VPN:</span>
                <span className={`font-mono font-semibold ${activeSelected.is_proxy_vpn ? 'text-red-600' : 'text-green-600'}`}>
                  {activeSelected.is_proxy_vpn ? 'YES' : 'NO'}
                </span>
              </div>
            )}
            {activeSelected.risk_tier && (
              <div className="flex justify-between items-center py-1 border-b border-gray-100">
                <span className="text-gray-500">Risk Tier:</span>
                <span className="font-mono text-orange-600 font-semibold">{activeSelected.risk_tier}</span>
              </div>
            )}
            {activeSelected.amount !== undefined && (
              <div className="flex justify-between items-center py-1 border-b border-gray-100">
                <span className="text-gray-500">Amount:</span>
                <span className="font-mono text-gray-900">${activeSelected.amount.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
