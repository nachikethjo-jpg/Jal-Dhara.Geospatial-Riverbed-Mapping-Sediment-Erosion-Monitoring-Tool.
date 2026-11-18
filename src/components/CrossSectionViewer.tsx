import React, { useState } from 'react';
import { CrossSectionProfile } from '../types/river';
import { ThemeConfig } from '../types/theme';
import { ArrowDown, ArrowUp, Info } from 'lucide-react';

interface CrossSectionViewerProps {
  profile: CrossSectionProfile;
  chainageKm: number;
  theme: ThemeConfig;
}

export const CrossSectionViewer: React.FC<CrossSectionViewerProps> = ({
  profile,
  chainageKm,
  theme,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<{
    offset: number;
    elev2019: number;
    elev2026: number;
    water: number;
    diff: number;
  } | null>(null);

  const svgWidth = 720;
  const svgHeight = 160;
  const padLeft = 45;
  const padRight = 30;
  const padTop = 20;
  const padBottom = 28;

  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  const allElevations = profile.points.flatMap((p) => [
    p.elevation2019,
    p.elevation2026,
    p.waterLevelM,
  ]);
  const minElev = Math.floor(Math.min(...allElevations) - 2);
  const maxElev = Math.ceil(Math.max(...allElevations) + 2);
  const elevRange = maxElev - minElev || 1;

  const maxOffset = profile.widthM;

  const scaleX = (offset: number) => padLeft + (offset / maxOffset) * plotWidth;
  const scaleY = (elev: number) => padTop + plotHeight - ((elev - minElev) / elevRange) * plotHeight;

  const path2019 = profile.points
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${scaleX(p.offsetM)} ${scaleY(p.elevation2019)}`)
    .join(' ');

  const path2026 = profile.points
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${scaleX(p.offsetM)} ${scaleY(p.elevation2026)}`)
    .join(' ');

  const waterLevel = profile.points[0]?.waterLevelM || 0;
  const waterY = scaleY(waterLevel);

  const waterFillPoints = [
    `M ${scaleX(profile.points[0].offsetM)} ${waterY}`,
    ...profile.points.map((p) => `L ${scaleX(p.offsetM)} ${scaleY(p.elevation2026)}`),
    `L ${scaleX(profile.points[profile.points.length - 1].offsetM)} ${waterY}`,
    'Z',
  ].join(' ');

  const gridStroke = theme.isDark ? 'rgba(71, 85, 105, 0.35)' : 'rgba(203, 213, 225, 0.8)';
  const bedStroke2026 = theme.ui.accent;
  const waterStroke = theme.id === 'thermal' ? '#c084fc' : '#38bdf8';
  const waterFill = theme.id === 'thermal' ? 'rgba(168, 85, 247, 0.18)' : 'rgba(14, 165, 233, 0.18)';

  return (
    <div
      className="w-full border rounded-lg p-3 transition-colors"
      style={{
        backgroundColor: theme.ui.cardBg,
        borderColor: theme.ui.border,
        color: theme.ui.textPrimary,
      }}
    >
      <div
        className="flex flex-wrap items-center justify-between gap-2 mb-2 pb-2 border-b"
        style={{ borderColor: theme.ui.border }}
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold text-xs tracking-wider uppercase">
            {profile.label}
          </span>
          <span
            className="text-[11px] font-mono px-2 py-0.5 rounded border"
            style={{
              backgroundColor: theme.ui.tagBg,
              borderColor: theme.ui.accent,
              color: theme.ui.accent,
            }}
          >
            Width: {profile.widthM} m
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 text-red-500">
            <ArrowDown className="w-3.5 h-3.5" />
            <span>Max Scour: {profile.maxScourM.toFixed(1)} m</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-500">
            <ArrowUp className="w-3.5 h-3.5" />
            <span>Thalweg Shift: {profile.thalwegShiftM} m W</span>
          </div>
        </div>
      </div>

      {/* SVG Cross-Section Graph */}
      <div className="relative overflow-x-auto">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto min-w-[500px]"
          onMouseLeave={() => setHoveredPoint(null)}
        >
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const elevVal = minElev + ratio * elevRange;
            const y = scaleY(elevVal);
            return (
              <g key={ratio}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={svgWidth - padRight}
                  y2={y}
                  stroke={gridStroke}
                  strokeDasharray="3 3"
                />
                <text
                  x={padLeft - 6}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="9"
                  fill={theme.ui.textMuted}
                  fontFamily="monospace"
                >
                  {elevVal.toFixed(0)}m
                </text>
              </g>
            );
          })}

          {/* Water Body Fill */}
          <path d={waterFillPoints} fill={waterFill} />

          {/* Water Surface Line */}
          <line
            x1={scaleX(profile.points[0].offsetM)}
            y1={waterY}
            x2={scaleX(profile.points[profile.points.length - 1].offsetM)}
            y2={waterY}
            stroke={waterStroke}
            strokeWidth="1.5"
            strokeDasharray="4 2"
          />
          <text
            x={scaleX(profile.points[profile.points.length - 1].offsetM) + 4}
            y={waterY + 3}
            fontSize="9"
            fill={waterStroke}
            fontFamily="monospace"
          >
            WL: {waterLevel.toFixed(1)}m
          </text>

          {/* 2019 Baseline Bed Profile */}
          <path
            d={path2019}
            fill="none"
            stroke={theme.ui.textMuted}
            strokeWidth="2"
            strokeDasharray="4 4"
            opacity="0.75"
          />

          {/* 2026 Current Bed Profile */}
          <path d={path2026} fill="none" stroke={bedStroke2026} strokeWidth="2.5" />

          {/* Interactive Inspection Circles */}
          {profile.points.map((p, idx) => {
            const cx = scaleX(p.offsetM);
            const cy = scaleY(p.elevation2026);
            const diff = p.elevation2026 - p.elevation2019;
            return (
              <circle
                key={idx}
                cx={cx}
                cy={cy}
                r="4.5"
                fill={diff < 0 ? '#ef4444' : theme.ui.accent}
                stroke={theme.ui.cardBg}
                strokeWidth="1.5"
                className="cursor-pointer hover:r-6 transition-all"
                onMouseEnter={() =>
                  setHoveredPoint({
                    offset: p.offsetM,
                    elev2019: p.elevation2019,
                    elev2026: p.elevation2026,
                    water: p.waterLevelM,
                    diff,
                  })
                }
              />
            );
          })}

          {/* X Axis distance ticks */}
          {profile.points.map((p, idx) => (
            <text
              key={idx}
              x={scaleX(p.offsetM)}
              y={svgHeight - 8}
              textAnchor="middle"
              fontSize="9"
              fill={theme.ui.textMuted}
              fontFamily="monospace"
            >
              {p.offsetM}m
            </text>
          ))}
        </svg>

        {/* Floating Tooltip */}
        {hoveredPoint && (
          <div
            className="absolute top-2 right-4 border px-3 py-1.5 rounded text-xs font-mono shadow-xl flex items-center gap-3"
            style={{
              backgroundColor: theme.ui.headerBg,
              borderColor: theme.ui.border,
              color: theme.ui.textPrimary,
            }}
          >
            <span>Offset: {hoveredPoint.offset}m</span>
            <span>2019: {hoveredPoint.elev2019}m</span>
            <span>2026: {hoveredPoint.elev2026}m</span>
            <span
              className={`font-semibold ${
                hoveredPoint.diff < 0 ? 'text-red-500' : 'text-cyan-500'
              }`}
            >
              Diff: {hoveredPoint.diff > 0 ? '+' : ''}
              {hoveredPoint.diff.toFixed(2)}m
            </span>
          </div>
        )}
      </div>

      {/* Legend & Notes */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 text-[11px] mt-2 pt-2 border-t"
        style={{ borderColor: theme.ui.border, color: theme.ui.textMuted }}
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span
              className="w-3 h-0.5 border-t border-dashed inline-block"
              style={{ borderColor: theme.ui.textMuted }}
            />
            <span>2019 Survey Datum</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="w-3 h-0.5 inline-block"
              style={{ backgroundColor: theme.ui.accent }}
            />
            <span>2026 Sonar Bed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="w-3 h-0.5 border-t border-dashed inline-block"
              style={{ borderColor: waterStroke }}
            />
            <span>Water Level</span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[10px]" style={{ color: theme.ui.textMuted }}>
          <Info className="w-3 h-3" />
          <span>Coordinates referenced to Mean Sea Level (MSL / WGS84).</span>
        </div>
      </div>
    </div>
  );
};
