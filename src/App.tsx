import React, { useState, useEffect, useMemo, useRef } from 'react';
import { APIProvider, Map } from '@vis.gl/react-google-maps';
import {
  RIVERS,
  RIVER_BY_ID,
  RiverId,
  RiverCase,
  formatYear,
  formatKm,
  riverStats,
  KIND_LABEL,
} from './lib/rivers';
import { RIVERS_DATA } from './data/riversData';
import { THEMES } from './types/theme';
import { MapRiverLayers } from './components/MapRiverLayers';
import { River3DScene } from './components/River3DScene';
import { ControlDock } from './components/ControlDock';
import { SedimentAuditModal } from './components/SedimentAuditModal';
import {
  Satellite,
  Mountain,
  Layers,
  Box,
  Play,
  Pause,
  Download,
  Info,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';

export default function App() {
  const [selectedRiverId, setSelectedRiverId] = useState<RiverId>('ghaggar');
  const river: RiverCase = RIVER_BY_ID[selectedRiverId] || RIVERS[0];

  const [year, setYear] = useState<number>(river.eventYear);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [activeMode, setActiveMode] = useState<'satellite' | 'terrain' | 'ink' | '3d'>('satellite');
  const [showAuditModal, setShowAuditModal] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [quotaExceeded, setQuotaExceeded] = useState<boolean>(false);

  // Layers toggle
  const [layers, setLayers] = useState({
    lost: true,
    born: true,
    water: true,
  });

  // 3D Scene parameters
  const [selectedChainageKm, setSelectedChainageKm] = useState<number>(12.0);
  const [showDoDHeatmap, setShowDoDHeatmap] = useState<boolean>(true);
  const [showWaterFlow, setShowWaterFlow] = useState<boolean>(true);
  const [showCrossSectionPlane, setShowCrossSectionPlane] = useState<boolean>(true);
  const [showVegetation, setShowVegetation] = useState<boolean>(true);
  const [verticalExaggeration, setVerticalExaggeration] = useState<number>(2.0);
  const [waterOpacity, setWaterOpacity] = useState<number>(0.75);

  const apiKey =
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY ||
    'AIzaSyBSyntZl-HsgqRF1XdfKASDw-QuH2yaxw0';

  const stats = useMemo(() => riverStats(river), [river]);
  const [minYear, maxYear] = river.era;

  // Sync year when river changes
  useEffect(() => {
    setYear(river.eventYear);
    setIsPlaying(false);
  }, [selectedRiverId]);

  // Quota exceeded listener
  useEffect(() => {
    const handleQuotaExceeded = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
  }, []);

  // Time-scrub play animation
  const playingRef = useRef(isPlaying);
  playingRef.current = isPlaying;

  useEffect(() => {
    if (!isPlaying) return;
    let animId = 0;
    let lastTime = performance.now();

    const tick = (now: number) => {
      if (!playingRef.current) return;
      const dt = now - lastTime;
      lastTime = now;

      setYear((prevYear) => {
        const span = maxYear - minYear;
        const speed = span / 8000; // 8 seconds full sweep
        const next = prevYear + (dt / 1000) * speed;
        if (next >= maxYear) {
          setIsPlaying(false);
          return maxYear;
        }
        return next;
      });

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, minYear, maxYear]);

  // Map type translation for Google Maps
  const gmapType = activeMode === 'terrain' ? 'terrain' : 'satellite';

  // Corresponding 3D detailed reach data if available
  const detailedRiverData =
    RIVERS_DATA[selectedRiverId as keyof typeof RIVERS_DATA] || RIVERS_DATA.kosi;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0d0f14] text-[#e4e4e7] font-sans antialiased select-none">
      {/* Quota notification banner */}
      {quotaExceeded && (
        <div className="fixed top-0 left-0 right-0 bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2 text-xs md:text-sm text-center z-50 shadow-md">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* ======================================================== */}
      {/* LEFT SIDEBAR: ELEGANT EDITORIAL ATLAS (LIKE REFERENCE)   */}
      {/* ======================================================== */}
      <aside
        className={`fixed md:relative z-30 flex flex-col h-full w-80 md:w-88 shrink-0 bg-[#0d0f14] border-r border-[#27272a]/70 transition-transform duration-300 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top Atlas Header */}
        <div className="p-5 pb-4 border-b border-[#27272a]/60">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-[0.22em] text-[#a1a1aa] font-medium">
              ATLAS
            </span>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden text-stone-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <h1 className="font-serif text-3xl md:text-4xl font-light text-stone-100 tracking-wide mt-1">
            OXBOW
          </h1>
          <p className="text-xs text-stone-400 mt-1 font-light leading-snug">
            Lost beds and new channels of India’s rivers.
          </p>
        </div>

        {/* Scrollable River List & Story Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col justify-between">
          {/* Rivers List */}
          <div className="p-3 space-y-1">
            {RIVERS.map((r) => {
              const isSelected = selectedRiverId === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => {
                    setSelectedRiverId(r.id);
                  }}
                  className={`w-full text-left p-3 rounded-xl transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-[#18181b] border border-[#3f3f46]/70 shadow-sm'
                      : 'hover:bg-[#18181b]/50 border border-transparent text-stone-400'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        isSelected ? 'bg-orange-500' : 'bg-stone-600'
                      }`}
                    />
                    <div>
                      <div
                        className={`text-sm font-medium ${
                          isSelected ? 'text-white' : 'text-stone-300'
                        }`}
                      >
                        {r.name}
                      </div>
                      <div className="text-[11px] text-orange-400/80 font-normal mt-0.5">
                        {KIND_LABEL[r.kind]}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs font-mono text-stone-400 font-light">
                    {formatYear(r.eventYear)}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Bottom Geomorphic Story Panel */}
          <div className="p-5 border-t border-[#27272a]/60 bg-[#0d0f14]">
            <div className="text-[10px] font-mono tracking-widest uppercase text-stone-500 mb-1.5">
              {river.region}
            </div>
            <h2 className="font-serif text-lg font-normal text-stone-200 leading-snug mb-2">
              {river.lede}
            </h2>
            <p className="text-xs text-stone-400 leading-relaxed font-light mb-4">
              {river.essay}
            </p>

            {/* River Stats Strip */}
            <div className="grid grid-cols-3 gap-2 py-2 border-t border-b border-[#27272a]/60 text-center font-mono text-xs mb-3">
              <div>
                <span className="text-[10px] text-stone-500 block">Lost Bed:</span>
                <span className="text-stone-300 font-semibold">{formatKm(stats.lostKm)}</span>
              </div>
              <div>
                <span className="text-[10px] text-stone-500 block">New Bed:</span>
                <span className="text-teal-400 font-semibold">{formatKm(stats.bornKm)}</span>
              </div>
              <div>
                <span className="text-[10px] text-stone-500 block">Displaced:</span>
                <span className="text-orange-400 font-semibold">
                  {river.displaced || 'Historical'}
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveMode(activeMode === '3d' ? 'satellite' : '3d')}
                className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                  activeMode === '3d'
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#1c1917] hover:bg-[#292524] text-stone-300 border border-stone-800'
                }`}
              >
                <Box className="w-3.5 h-3.5" />
                <span>{activeMode === '3d' ? 'Exit 3D' : '3D Bathymetry'}</span>
              </button>

              <button
                onClick={() => setShowAuditModal(true)}
                className="py-1.5 px-3 rounded-lg text-xs font-medium bg-[#1c1917] hover:bg-[#292524] text-stone-300 border border-stone-800 flex items-center gap-1"
                title="Download Sediment Audit"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Audit</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* ======================================================== */}
      {/* MAIN VIEWPORT: GOOGLE MAPS SATELLITE / 3D BATHYMETRY     */}
      {/* ======================================================== */}
      <main className="relative flex-1 h-full w-full overflow-hidden bg-black">
        {/* Mobile menu button */}
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="md:hidden absolute top-3 left-3 z-30 bg-[#0d0f14]/90 border border-stone-800 text-stone-300 p-2 rounded-xl shadow-xl"
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* 3D Mode vs Google Maps Satellite Mode */}
        {activeMode === '3d' ? (
          <div className="relative w-full h-full">
            <River3DScene
              river={detailedRiverData}
              activeEpoch="2026_current"
              selectedChainageKm={selectedChainageKm}
              showDoDHeatmap={showDoDHeatmap}
              showWaterFlow={showWaterFlow}
              showCrossSectionPlane={showCrossSectionPlane}
              showVegetation={showVegetation}
              verticalExaggeration={verticalExaggeration}
              waterOpacity={waterOpacity}
              theme={THEMES.sonar}
            />

            {/* Collapsible Dock inside 3D View */}
            <ControlDock
              river={detailedRiverData}
              activeEpoch="2026_current"
              onEpochChange={() => {}}
              selectedChainageKm={selectedChainageKm}
              onChainageChange={setSelectedChainageKm}
              showDoDHeatmap={showDoDHeatmap}
              onToggleDoD={() => setShowDoDHeatmap(!showDoDHeatmap)}
              showWaterFlow={showWaterFlow}
              onToggleWaterFlow={() => setShowWaterFlow(!showWaterFlow)}
              showCrossSectionPlane={showCrossSectionPlane}
              onToggleCrossSectionPlane={() =>
                setShowCrossSectionPlane(!showCrossSectionPlane)
              }
              showVegetation={showVegetation}
              onToggleVegetation={() => setShowVegetation(!showVegetation)}
              verticalExaggeration={verticalExaggeration}
              onVerticalExaggerationChange={setVerticalExaggeration}
              waterOpacity={waterOpacity}
              onWaterOpacityChange={setWaterOpacity}
              theme={THEMES.sonar}
              onSelectStation={() => {}}
            />
          </div>
        ) : (
          <div className="relative w-full h-full">
            <APIProvider apiKey={apiKey}>
              <Map
                key={`${river.id}-${gmapType}`}
                mapId="DEMO_MAP_ID"
                internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                defaultCenter={{ lat: river.view.center[1], lng: river.view.center[0] }}
                defaultZoom={river.view.zoom}
                mapTypeId={gmapType}
                style={{ width: '100%', height: '100%' }}
                gestureHandling="greedy"
                disableDefaultUI={false}
              >
                {/* Vector Overlays for River Scars, Lost Bed, Born Bed & Active Water */}
                <MapRiverLayers river={river} year={year} layers={layers} />
              </Map>
            </APIProvider>
          </div>
        )}

        {/* ======================================================== */}
        {/* TOP-RIGHT FLOATING CONTROLS (EXACTLY AS IN SCREENSHOT)   */}
        {/* ======================================================== */}
        <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2.5 pointer-events-auto">
          {/* Basemap Switcher Pill */}
          <div className="flex items-center gap-1 bg-[#0d0f14]/90 backdrop-blur-sm border border-stone-800/80 p-1 rounded-xl shadow-2xl">
            <button
              onClick={() => setActiveMode('satellite')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeMode === 'satellite'
                  ? 'bg-stone-800 text-white shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Satellite className="w-3.5 h-3.5" />
              <span>Satellite</span>
            </button>

            <button
              onClick={() => setActiveMode('terrain')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeMode === 'terrain'
                  ? 'bg-stone-800 text-white shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Mountain className="w-3.5 h-3.5" />
              <span>Terrain</span>
            </button>

            <button
              onClick={() => setActiveMode('3d')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeMode === '3d'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>3D Bathymetry</span>
            </button>

            <button
              onClick={() => setActiveMode('ink')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeMode === 'ink'
                  ? 'bg-stone-800 text-white shadow-sm'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Ink</span>
            </button>
          </div>

          {/* Legend Card (Clean minimal dots with toggle) */}
          <div className="bg-[#0d0f14]/90 backdrop-blur-sm border border-stone-800/80 px-3 py-2 rounded-xl shadow-xl flex flex-col gap-1.5 text-xs font-light">
            <button
              onClick={() => setLayers((l) => ({ ...l, lost: !l.lost }))}
              className={`flex items-center gap-2 hover:opacity-100 transition-opacity ${
                layers.lost ? 'opacity-100' : 'opacity-40'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#f97316] shrink-0" />
              <span className="text-stone-300">Lost bed</span>
            </button>

            <button
              onClick={() => setLayers((l) => ({ ...l, born: !l.born }))}
              className={`flex items-center gap-2 hover:opacity-100 transition-opacity ${
                layers.born ? 'opacity-100' : 'opacity-40'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#14b8a6] shrink-0" />
              <span className="text-stone-300">New bed</span>
            </button>

            <button
              onClick={() => setLayers((l) => ({ ...l, water: !l.water }))}
              className={`flex items-center gap-2 hover:opacity-100 transition-opacity ${
                layers.water ? 'opacity-100' : 'opacity-40'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-white shrink-0" />
              <span className="text-stone-300">Water</span>
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* FLOATING BOTTOM TIME-SCRUB PLAYER (MATCHING SCREENSHOT)  */}
        {/* ======================================================== */}
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 w-[94%] max-w-3xl z-20 pointer-events-auto">
          <div className="bg-[#0d0f14]/95 backdrop-blur-sm border border-stone-800 rounded-2xl p-4 shadow-2xl">
            {/* Header: YEAR, Big Digits, Event Label & Play Button */}
            <div className="flex items-center justify-between gap-4 mb-2">
              <div className="flex items-baseline gap-3">
                <span className="text-[10px] font-mono tracking-widest text-stone-500 uppercase">
                  YEAR
                </span>
                <span className="text-2xl font-mono font-medium text-white tracking-tight">
                  {formatYear(year)}
                </span>
              </div>

              <div className="hidden sm:block text-xs text-stone-400 font-light italic truncate max-w-sm">
                {river.eventLabel}
              </div>

              {/* Play / Pause button */}
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-9 h-9 rounded-xl bg-stone-800 hover:bg-stone-700 text-white flex items-center justify-center transition-colors shadow-sm"
                title={isPlaying ? 'Pause' : 'Play Timeline'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>
            </div>

            {/* Slider bar */}
            <div className="relative py-1">
              <input
                type="range"
                min={minYear}
                max={maxYear}
                step={1}
                value={year}
                onChange={(e) => {
                  setYear(parseFloat(e.target.value));
                  setIsPlaying(false);
                }}
                className="w-full h-1 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-white"
              />
            </div>

            {/* Footer row: Scale Years, Legend Swatches & Rewriting Bed Tag */}
            <div className="flex items-center justify-between text-[11px] text-stone-500 font-mono mt-1">
              <span>{formatYear(minYear)}</span>

              <div className="flex items-center gap-4 text-xs font-light">
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-1.5 rounded-sm bg-[#f97316]/80 inline-block" />
                  <span className="text-stone-400">Abandoned</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-1.5 rounded-sm bg-[#14b8a6]/80 inline-block" />
                  <span className="text-stone-400">New channel</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3.5 h-1.5 rounded-sm bg-white inline-block" />
                  <span className="text-stone-400">Water</span>
                </div>
              </div>

              <div className="hidden md:flex items-center gap-1.5 text-stone-500 font-serif italic">
                <span>≈ rewriting the bed</span>
              </div>

              <span>{formatYear(maxYear)}</span>
            </div>
          </div>
        </div>
      </main>

      {/* Sediment Audit Dossier Modal */}
      {showAuditModal && (
        <SedimentAuditModal
          river={detailedRiverData}
          activeEpoch="2026_current"
          theme={THEMES.sonar}
          onClose={() => setShowAuditModal(false)}
        />
      )}
    </div>
  );
}
