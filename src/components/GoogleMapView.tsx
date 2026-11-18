import React, { useState } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  Pin,
} from '@vis.gl/react-google-maps';
import { RiverReachData, GaugeStation, VulnerabilityZone } from '../types/river';
import { ThemeConfig } from '../types/theme';
import { Activity, AlertTriangle } from 'lucide-react';

interface GoogleMapViewProps {
  river: RiverReachData;
  apiKey: string;
  theme: ThemeConfig;
  selectedStationId?: string;
  onSelectStation: (stationId: string) => void;
}

export const GoogleMapView: React.FC<GoogleMapViewProps> = ({
  river,
  apiKey,
  theme,
  selectedStationId,
  onSelectStation,
}) => {
  const [selectedStation, setSelectedStation] = useState<GaugeStation | null>(null);
  const [selectedZone, setSelectedZone] = useState<VulnerabilityZone | null>(null);
  const [mapType, setMapType] = useState<'satellite' | 'terrain' | 'roadmap' | 'hybrid'>(
    theme.mapTypeId
  );

  return (
    <div className="relative w-full h-full min-h-[400px] overflow-hidden">
      <APIProvider apiKey={apiKey}>
        <Map
          key={`${river.id}-${mapType}`}
          mapId="DEMO_MAP_ID"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          defaultCenter={river.centerCoordinates}
          defaultZoom={river.defaultZoom}
          mapTypeId={mapType}
          style={{ width: '100%', height: '100%' }}
          gestureHandling="greedy"
          disableDefaultUI={false}
        >
          {/* CWC Gauge Station Markers */}
          {river.stations.map((station) => (
            <AdvancedMarker
              key={station.id}
              position={{ lat: station.lat, lng: station.lng }}
              title={station.name}
              onClick={() => {
                setSelectedStation(station);
                setSelectedZone(null);
                onSelectStation(station.id);
              }}
            >
              <Pin
                background={
                  station.status === 'critical'
                    ? '#ef4444'
                    : station.status === 'warning'
                    ? '#f59e0b'
                    : theme.ui.accent
                }
                borderColor="#ffffff"
                glyphColor="#ffffff"
              />
            </AdvancedMarker>
          ))}

          {/* Vulnerability Zone Alerts */}
          {river.vulnerabilityZones.map((zone) => (
            <AdvancedMarker
              key={zone.id}
              position={{ lat: zone.lat, lng: zone.lng }}
              title={zone.name}
              onClick={() => {
                setSelectedZone(zone);
                setSelectedStation(null);
              }}
            >
              <div className="bg-red-500 text-white p-1.5 rounded-full border-2 border-white shadow-lg animate-bounce">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
            </AdvancedMarker>
          ))}

          {/* Station InfoWindow */}
          {selectedStation && (
            <InfoWindow
              position={{ lat: selectedStation.lat, lng: selectedStation.lng }}
              onCloseClick={() => setSelectedStation(null)}
            >
              <div className="p-2 max-w-xs text-slate-900">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 mb-1">
                  <Activity className="w-3.5 h-3.5 text-blue-600" />
                  <span>{selectedStation.name}</span>
                </div>
                <div className="text-[11px] text-slate-600 mb-2">
                  Chainage: Ch {selectedStation.chainageKm.toFixed(1)} km
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2 rounded border border-slate-200">
                  <div>
                    <span className="text-slate-500 block">Current Stage:</span>
                    <span className="font-semibold text-slate-900 font-mono">
                      {selectedStation.currentStageM.toFixed(2)} m
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Danger Level:</span>
                    <span className="font-semibold text-red-600 font-mono">
                      {selectedStation.dangerLevelM.toFixed(2)} m
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Discharge:</span>
                    <span className="font-semibold text-slate-900 font-mono">
                      {selectedStation.dischargeCumec.toLocaleString()} m³/s
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Silt Content:</span>
                    <span className="font-semibold text-amber-600 font-mono">
                      {selectedStation.sedimentConcentrationGpl} g/L
                    </span>
                  </div>
                </div>

                <div className="mt-2 text-[10px] text-slate-500 flex items-center justify-between">
                  <span>HFL: {selectedStation.hflM}m</span>
                  <span
                    className={`font-semibold uppercase ${
                      selectedStation.status === 'critical'
                        ? 'text-red-600'
                        : selectedStation.status === 'warning'
                        ? 'text-amber-600'
                        : 'text-emerald-600'
                    }`}
                  >
                    Status: {selectedStation.status}
                  </span>
                </div>
              </div>
            </InfoWindow>
          )}

          {/* Vulnerability Zone InfoWindow */}
          {selectedZone && (
            <InfoWindow
              position={{ lat: selectedZone.lat, lng: selectedZone.lng }}
              onCloseClick={() => setSelectedZone(null)}
            >
              <div className="p-2 max-w-xs text-slate-900">
                <div className="flex items-center gap-1.5 text-xs font-bold text-red-700 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>{selectedZone.name}</span>
                </div>
                <div className="text-[11px] text-slate-600 mb-1">
                  Bank: {selectedZone.bank} (Ch {selectedZone.chainageStartKm} – {selectedZone.chainageEndKm} km)
                </div>
                <div className="text-[11px] bg-red-50 border border-red-200 text-red-900 p-2 rounded mb-2">
                  <div className="font-medium">Scour Depth: {selectedZone.scourDepthM}m</div>
                  <div className="text-[10px] text-slate-700 mt-0.5">
                    Threat: {selectedZone.threatenedInfrastructure}
                  </div>
                </div>
                <div className="text-[10px] text-slate-500">
                  <span className="font-semibold text-slate-700">Mitigation: </span>
                  {selectedZone.mitigationMeasures}
                </div>
              </div>
            </InfoWindow>
          )}
        </Map>
      </APIProvider>

      {/* Floating Map Controls & Overlays styled with theme */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        {/* Basemap Switcher */}
        <div
          className="border p-1 rounded-lg flex items-center gap-1 text-xs shadow-lg"
          style={{
            backgroundColor: theme.ui.headerBg,
            borderColor: theme.ui.border,
          }}
        >
          {(['satellite', 'terrain', 'roadmap', 'hybrid'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setMapType(type)}
              className="px-2.5 py-1 rounded text-xs font-medium transition-colors capitalize"
              style={{
                backgroundColor: mapType === type ? theme.ui.accent : 'transparent',
                color: mapType === type ? '#ffffff' : theme.ui.textSecondary,
              }}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Reach Telemetry Quickcard */}
        <div
          className="border p-3 rounded-lg text-xs shadow-xl w-64"
          style={{
            backgroundColor: theme.ui.cardBg,
            borderColor: theme.ui.border,
            color: theme.ui.textPrimary,
          }}
        >
          <div className="font-semibold mb-1 flex items-center justify-between">
            <span>{river.name} Reach</span>
            <span
              className="text-[10px] font-mono px-1.5 py-0.5 rounded border"
              style={{
                backgroundColor: theme.ui.tagBg,
                borderColor: theme.ui.accent,
                color: theme.ui.accent,
              }}
            >
              {river.state}
            </span>
          </div>
          <div
            className="text-[11px] mb-2 line-clamp-1"
            style={{ color: theme.ui.textMuted }}
          >
            {river.reachName}
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
            <div>
              <span style={{ color: theme.ui.textMuted }}>Length:</span>{' '}
              <span className="font-mono font-semibold">{river.reachLengthKm} km</span>
            </div>
            <div>
              <span style={{ color: theme.ui.textMuted }}>Avg Width:</span>{' '}
              <span className="font-mono font-semibold">{river.avgChannelWidthM} m</span>
            </div>
            <div>
              <span style={{ color: theme.ui.textMuted }}>Sinuosity:</span>{' '}
              <span className="font-mono font-semibold">{river.sinuosityIndex}</span>
            </div>
            <div>
              <span style={{ color: theme.ui.textMuted }}>Braiding:</span>{' '}
              <span className="font-mono font-semibold">{river.braidingIndex}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
