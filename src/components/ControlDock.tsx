import React, { useState } from 'react';
import { RiverReachData, SurveyEpoch } from '../types/river';
import { ThemeConfig } from '../types/theme';
import { CrossSectionViewer } from './CrossSectionViewer';
import {
  ChevronDown,
  ChevronUp,
  Layers,
  Sliders,
  TrendingDown,
  TrendingUp,
  Waves,
  AlertOctagon,
  Eye,
  Activity,
  ArrowRight,
} from 'lucide-react';

interface ControlDockProps {
  river: RiverReachData;
  activeEpoch: SurveyEpoch;
  onEpochChange: (epoch: SurveyEpoch) => void;
  selectedChainageKm: number;
  onChainageChange: (chainageKm: number) => void;
  showDoDHeatmap: boolean;
  onToggleDoD: () => void;
  showWaterFlow: boolean;
  onToggleWaterFlow: () => void;
  showCrossSectionPlane: boolean;
  onToggleCrossSectionPlane: () => void;
  showVegetation: boolean;
  onToggleVegetation: () => void;
  verticalExaggeration: number;
  onVerticalExaggerationChange: (val: number) => void;
  waterOpacity: number;
  onWaterOpacityChange: (val: number) => void;
  theme: ThemeConfig;
  activeStationId?: string;
  onSelectStation: (id: string) => void;
}

type TabType = 'epoch' | 'transect' | 'hydraulics' | 'vulnerability';

export const ControlDock: React.FC<ControlDockProps> = ({
  river,
  activeEpoch,
  onEpochChange,
  selectedChainageKm,
  onChainageChange,
  showDoDHeatmap,
  onToggleDoD,
  showWaterFlow,
  onToggleWaterFlow,
  showCrossSectionPlane,
  onToggleCrossSectionPlane,
  showVegetation,
  onToggleVegetation,
  verticalExaggeration,
  onVerticalExaggerationChange,
  waterOpacity,
  onWaterOpacityChange,
  theme,
  activeStationId,
  onSelectStation,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('epoch');

  const currentProfile =
    river.crossSections.reduce((prev, curr) =>
      Math.abs(curr.chainageKm - selectedChainageKm) < Math.abs(prev.chainageKm - selectedChainageKm)
        ? curr
        : prev,
      river.crossSections[0]
    ) || river.crossSections[0];

  const currentEpochInfo = river.epochs.find((e) => e.id === activeEpoch) || river.epochs[0];

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 w-full max-w-[1020px] px-3 z-30 pointer-events-auto">
      {/* Collapse / Expand Toggle Button */}
      <div className="flex justify-center -mb-px">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="border px-3 py-1 rounded-t-lg text-xs font-medium flex items-center gap-1.5 shadow-xl transition-all"
          style={{
            backgroundColor: theme.ui.headerBg,
            borderColor: theme.ui.border,
            color: theme.ui.textPrimary,
          }}
        >
          {isCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" style={{ color: theme.ui.accent }} />
              <span>Show Controls Dock (H)</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" style={{ color: theme.ui.textMuted }} />
              <span>Hide Controls (H)</span>
            </>
          )}
        </button>
      </div>

      {/* Main Unified Dock Container */}
      {!isCollapsed && (
        <div
          className="border rounded-b-xl rounded-t-lg shadow-2xl p-3 transition-colors"
          style={{
            backgroundColor: theme.ui.dockBg,
            borderColor: theme.ui.border,
            color: theme.ui.textPrimary,
          }}
        >
          {/* Header Bar: Tabs & Quick Metrics */}
          <div
            className="flex flex-wrap items-center justify-between gap-3 pb-2.5 mb-2.5 border-b"
            style={{ borderColor: theme.ui.border }}
          >
            {/* Tab navigation */}
            <div
              className="flex items-center gap-1 p-1 rounded-lg border"
              style={{
                backgroundColor: theme.isDark ? 'rgba(0,0,0,0.3)' : 'rgba(241,245,249,0.8)',
                borderColor: theme.ui.border,
              }}
            >
              <button
                onClick={() => setActiveTab('epoch')}
                className="px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors"
                style={{
                  backgroundColor: activeTab === 'epoch' ? theme.ui.accent : 'transparent',
                  color: activeTab === 'epoch' ? '#ffffff' : theme.ui.textSecondary,
                }}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Multi-Epoch DoD</span>
              </button>

              <button
                onClick={() => setActiveTab('transect')}
                className="px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors"
                style={{
                  backgroundColor: activeTab === 'transect' ? theme.ui.accent : 'transparent',
                  color: activeTab === 'transect' ? '#ffffff' : theme.ui.textSecondary,
                }}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Cross-Section</span>
              </button>

              <button
                onClick={() => setActiveTab('hydraulics')}
                className="px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors"
                style={{
                  backgroundColor: activeTab === 'hydraulics' ? theme.ui.accent : 'transparent',
                  color: activeTab === 'hydraulics' ? '#ffffff' : theme.ui.textSecondary,
                }}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>3D & Hydraulics</span>
              </button>

              <button
                onClick={() => setActiveTab('vulnerability')}
                className="px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors"
                style={{
                  backgroundColor: activeTab === 'vulnerability' ? theme.ui.accent : 'transparent',
                  color: activeTab === 'vulnerability' ? '#ffffff' : theme.ui.textSecondary,
                }}
              >
                <AlertOctagon className="w-3.5 h-3.5 text-amber-500" />
                <span>Bank Threat ({river.vulnerabilityZones.length})</span>
              </button>
            </div>

            {/* Live Sediment Summary Badges */}
            <div className="hidden sm:flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span style={{ color: theme.ui.textMuted }}>Net Balance:</span>
                <span
                  className="font-semibold"
                  style={{
                    color:
                      river.sedimentBudget.netSedimentBalanceM3 >= 0
                        ? theme.ui.accent
                        : '#f59e0b',
                  }}
                >
                  {river.sedimentBudget.netSedimentBalanceM3 >= 0 ? '+' : ''}
                  {(river.sedimentBudget.netSedimentBalanceM3 / 1000000).toFixed(1)}M m³
                </span>
              </div>
              <div className="flex items-center gap-1.5" style={{ color: theme.ui.textMuted }}>
                <span>Migration:</span>
                <span className="font-semibold" style={{ color: theme.ui.textPrimary }}>
                  {river.sedimentBudget.lateralMigrationRateMPerYr} m/yr
                </span>
              </div>
            </div>
          </div>

          {/* Tab 1: Multi-Epoch Timeline & DoD Cut-and-Fill */}
          {activeTab === 'epoch' && (
            <div className="space-y-3">
              {/* Epoch Slider & Button Pills */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {river.epochs.map((epoch) => {
                  const isSelected = activeEpoch === epoch.id;
                  return (
                    <button
                      key={epoch.id}
                      onClick={() => onEpochChange(epoch.id)}
                      className="p-2 rounded-lg text-left border transition-all"
                      style={{
                        backgroundColor: isSelected ? theme.ui.tagBg : theme.ui.cardBg,
                        borderColor: isSelected ? theme.ui.accent : theme.ui.border,
                      }}
                    >
                      <div className="font-semibold text-xs" style={{ color: theme.ui.textPrimary }}>
                        {epoch.year}
                      </div>
                      <div className="text-[10px] truncate" style={{ color: theme.ui.textMuted }}>
                        {epoch.season}
                      </div>
                      <div className="text-[10px] font-mono mt-1" style={{ color: theme.ui.accent }}>
                        WL: {epoch.waterLevelOffset > 0 ? '+' : ''}
                        {epoch.waterLevelOffset}m
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Epoch Details & Volume Breakdown */}
              <div
                className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 rounded-lg border text-xs"
                style={{
                  backgroundColor: theme.ui.cardBg,
                  borderColor: theme.ui.border,
                }}
              >
                <div className="md:col-span-2">
                  <div className="font-semibold mb-1 flex items-center gap-2">
                    <span style={{ color: theme.ui.textPrimary }}>{currentEpochInfo.label}</span>
                    <button
                      onClick={onToggleDoD}
                      className="px-2 py-0.5 rounded text-[10px] font-medium transition-colors"
                      style={{
                        backgroundColor: showDoDHeatmap ? theme.ui.accent : 'rgba(100,116,139,0.3)',
                        color: showDoDHeatmap ? '#ffffff' : theme.ui.textSecondary,
                      }}
                    >
                      {showDoDHeatmap ? 'DoD Shading: ACTIVE' : 'DoD Shading: OFF'}
                    </button>
                  </div>
                  <p className="text-[11px] leading-relaxed" style={{ color: theme.ui.textSecondary }}>
                    {currentEpochInfo.description}
                  </p>
                </div>

                {/* Volumetric Mass Balance */}
                <div
                  className="flex flex-col justify-center space-y-1.5 border-t md:border-t-0 md:border-l md:pl-3"
                  style={{ borderColor: theme.ui.border }}
                >
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="flex items-center gap-1" style={{ color: theme.ui.textMuted }}>
                      <TrendingDown className="w-3 h-3 text-red-500" /> Scour Loss:
                    </span>
                    <span className="font-mono text-red-500 font-semibold">
                      -{(river.sedimentBudget.grossErosionM3 / 1000000).toFixed(1)}M m³
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="flex items-center gap-1" style={{ color: theme.ui.textMuted }}>
                      <TrendingUp className="w-3 h-3" style={{ color: theme.ui.accent }} /> Silt Accretion:
                    </span>
                    <span className="font-mono font-semibold" style={{ color: theme.ui.accent }}>
                      +{(river.sedimentBudget.grossDepositionM3 / 1000000).toFixed(1)}M m³
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Cross-Section Transect Slicer */}
          {activeTab === 'transect' && (
            <div className="space-y-3">
              {/* Chainage Station Slider */}
              <div
                className="flex flex-col sm:flex-row items-center gap-3 p-2.5 rounded-lg border"
                style={{
                  backgroundColor: theme.ui.cardBg,
                  borderColor: theme.ui.border,
                }}
              >
                <span className="text-xs font-semibold whitespace-nowrap" style={{ color: theme.ui.textPrimary }}>
                  Chainage Station:
                </span>
                <input
                  type="range"
                  min="0"
                  max={river.reachLengthKm}
                  step="0.5"
                  value={selectedChainageKm}
                  onChange={(e) => onChainageChange(parseFloat(e.target.value))}
                  className="w-full h-1.5 rounded-lg cursor-pointer"
                  style={{ accentColor: theme.ui.accent }}
                />
                <span
                  className="text-xs font-mono font-bold whitespace-nowrap min-w-[75px] text-right"
                  style={{ color: theme.ui.accent }}
                >
                  Ch {selectedChainageKm.toFixed(1)} km
                </span>
                <button
                  onClick={onToggleCrossSectionPlane}
                  className="px-2.5 py-1 rounded text-xs whitespace-nowrap transition-colors"
                  style={{
                    backgroundColor: showCrossSectionPlane ? '#ef4444' : 'rgba(100,116,139,0.3)',
                    color: '#ffffff',
                  }}
                >
                  {showCrossSectionPlane ? '3D Plane: ON' : '3D Plane: OFF'}
                </button>
              </div>

              {/* Render Cross Section Viewer with Theme */}
              <CrossSectionViewer profile={currentProfile} chainageKm={selectedChainageKm} theme={theme} />
            </div>
          )}

          {/* Tab 3: 3D Visualization & Hydraulics */}
          {activeTab === 'hydraulics' && (
            <div
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 p-3 rounded-lg border text-xs"
              style={{
                backgroundColor: theme.ui.cardBg,
                borderColor: theme.ui.border,
              }}
            >
              {/* Vertical Exaggeration */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span style={{ color: theme.ui.textSecondary }}>Vertical Exaggeration:</span>
                  <span className="font-mono font-semibold" style={{ color: theme.ui.accent }}>
                    {verticalExaggeration.toFixed(1)}x
                  </span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="3.5"
                  step="0.1"
                  value={verticalExaggeration}
                  onChange={(e) => onVerticalExaggerationChange(parseFloat(e.target.value))}
                  className="w-full h-1.5 rounded-lg cursor-pointer"
                  style={{ accentColor: theme.ui.accent }}
                />
                <div className="text-[10px] mt-1" style={{ color: theme.ui.textMuted }}>
                  Magnifies subtle bed relief and sand dunes
                </div>
              </div>

              {/* Water Opacity */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span style={{ color: theme.ui.textSecondary }}>Water Layer Opacity:</span>
                  <span className="font-mono font-semibold" style={{ color: theme.ui.accent }}>
                    {Math.round(waterOpacity * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.95"
                  step="0.05"
                  value={waterOpacity}
                  onChange={(e) => onWaterOpacityChange(parseFloat(e.target.value))}
                  className="w-full h-1.5 rounded-lg cursor-pointer"
                  style={{ accentColor: theme.ui.accent }}
                />
                <div className="text-[10px] mt-1" style={{ color: theme.ui.textMuted }}>
                  Adjust to inspect underwater bathymetry
                </div>
              </div>

              {/* Flow Particles Toggle */}
              <div
                className="flex flex-col justify-between p-2 rounded border"
                style={{
                  backgroundColor: theme.isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.7)',
                  borderColor: theme.ui.border,
                }}
              >
                <span className="font-medium" style={{ color: theme.ui.textPrimary }}>
                  Flow Vectors & Silt:
                </span>
                <button
                  onClick={onToggleWaterFlow}
                  className="mt-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: showWaterFlow ? '#d97706' : 'rgba(100,116,139,0.3)',
                    color: '#ffffff',
                  }}
                >
                  <Waves className="w-3.5 h-3.5 inline mr-1.5" />
                  {showWaterFlow ? 'Flow Particles: ON' : 'Flow Particles: OFF'}
                </button>
              </div>

              {/* Riparian Vegetation Toggle */}
              <div
                className="flex flex-col justify-between p-2 rounded border"
                style={{
                  backgroundColor: theme.isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.7)',
                  borderColor: theme.ui.border,
                }}
              >
                <span className="font-medium" style={{ color: theme.ui.textPrimary }}>
                  Riparian Vegetation:
                </span>
                <button
                  onClick={onToggleVegetation}
                  className="mt-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: showVegetation ? '#16a34a' : 'rgba(100,116,139,0.3)',
                    color: '#ffffff',
                  }}
                >
                  <Eye className="w-3.5 h-3.5 inline mr-1.5" />
                  {showVegetation ? 'Floodplain Flora: ON' : 'Floodplain Flora: OFF'}
                </button>
              </div>
            </div>
          )}

          {/* Tab 4: Bank Vulnerability & Embankment Threats */}
          {activeTab === 'vulnerability' && (
            <div className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                {river.vulnerabilityZones.map((zone) => (
                  <div
                    key={zone.id}
                    className="p-2.5 rounded-lg border text-xs flex flex-col justify-between"
                    style={{
                      backgroundColor: theme.ui.cardBg,
                      borderColor: theme.ui.border,
                    }}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold flex items-center gap-1.5" style={{ color: theme.ui.textPrimary }}>
                          <AlertOctagon
                            className={`w-3.5 h-3.5 ${
                              zone.riskLevel === 'Severe'
                                ? 'text-red-500'
                                : zone.riskLevel === 'High'
                                ? 'text-amber-500'
                                : 'text-blue-500'
                            }`}
                          />
                          {zone.name}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                            zone.riskLevel === 'Severe'
                              ? 'bg-red-500/20 text-red-500 border border-red-500/40'
                              : 'bg-amber-500/20 text-amber-500 border border-amber-500/40'
                          }`}
                        >
                          {zone.riskLevel}
                        </span>
                      </div>
                      <div className="text-[11px] mb-1" style={{ color: theme.ui.textMuted }}>
                        Chainage: Ch {zone.chainageStartKm} – {zone.chainageEndKm} km ({zone.bank})
                      </div>
                      <div className="text-[11px]">
                        <span style={{ color: theme.ui.textMuted }}>Scour Depth: </span>
                        <span className="font-mono text-red-500 font-semibold">
                          {zone.scourDepthM} m
                        </span>
                      </div>
                      <div className="text-[10px] mt-1 line-clamp-1" style={{ color: theme.ui.textSecondary }}>
                        Threat: {zone.threatenedInfrastructure}
                      </div>
                    </div>

                    <div
                      className="mt-2 pt-1.5 border-t flex justify-between items-center"
                      style={{ borderColor: theme.ui.border }}
                    >
                      <span
                        className="text-[10px] truncate max-w-[240px]"
                        style={{ color: theme.ui.textMuted }}
                      >
                        {zone.mitigationMeasures}
                      </span>
                      <button
                        onClick={() => onChainageChange(zone.chainageStartKm)}
                        className="text-[10px] flex items-center gap-0.5 font-medium ml-2 shrink-0 hover:underline"
                        style={{ color: theme.ui.accent }}
                      >
                        Inspect <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
