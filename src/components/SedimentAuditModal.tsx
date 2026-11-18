import React from 'react';
import { RiverReachData, SurveyEpoch } from '../types/river';
import { ThemeConfig } from '../types/theme';
import { Download, FileText, X, CheckCircle, ShieldAlert } from 'lucide-react';

interface SedimentAuditModalProps {
  river: RiverReachData;
  activeEpoch: SurveyEpoch;
  theme: ThemeConfig;
  onClose: () => void;
}

export const SedimentAuditModal: React.FC<SedimentAuditModalProps> = ({
  river,
  activeEpoch,
  theme,
  onClose,
}) => {
  const currentEpoch = river.epochs.find((e) => e.id === activeEpoch) || river.epochs[0];

  const handleDownloadCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += `RIVERBED SEDIMENT MONITORING AUDIT REPORT\n`;
    csvContent += `River Reach,${river.name} (${river.reachName})\n`;
    csvContent += `State,${river.state}\n`;
    csvContent += `Theme,${theme.name}\n`;
    csvContent += `Survey Epoch,${currentEpoch.label} (${currentEpoch.season} ${currentEpoch.year})\n`;
    csvContent += `Date of Export,${new Date().toISOString()}\n\n`;

    csvContent += `--- VOLUMETRIC SEDIMENT BUDGET ---\n`;
    csvContent += `Metric,Value,Unit\n`;
    csvContent += `Gross Erosion Scour,${river.sedimentBudget.grossErosionM3},m3\n`;
    csvContent += `Gross Silt Deposition,${river.sedimentBudget.grossDepositionM3},m3\n`;
    csvContent += `Net Sediment Balance,${river.sedimentBudget.netSedimentBalanceM3},m3\n`;
    csvContent += `Specific Sediment Yield,${river.sedimentBudget.specificYieldTonnesPerSqKmYr},Tonnes/km2/year\n`;
    csvContent += `Average Bed Aggradation,${river.sedimentBudget.avgChannelAggradationM},meters\n`;
    csvContent += `Channel Lateral Migration Rate,${river.sedimentBudget.lateralMigrationRateMPerYr},meters/year\n\n`;

    csvContent += `--- CWC HYDROMETRIC & GAUGE STATIONS ---\n`;
    csvContent += `Station Name,Chainage (km),Lat,Lng,Stage (m),Danger Level (m),Discharge (cumecs),Silt Concentration (g/L),Status\n`;
    river.stations.forEach((s) => {
      csvContent += `"${s.name}",${s.chainageKm},${s.lat},${s.lng},${s.currentStageM},${s.dangerLevelM},${s.dischargeCumec},${s.sedimentConcentrationGpl},${s.status}\n`;
    });
    csvContent += `\n`;

    csvContent += `--- EMBANKMENT VULNERABILITY ZONES ---\n`;
    csvContent += `Zone Name,Chainage (km),Bank,Risk Level,Max Scour (m),Threatened Infrastructure\n`;
    river.vulnerabilityZones.forEach((z) => {
      csvContent += `"${z.name}","Ch ${z.chainageStartKm}-${z.chainageEndKm}",${z.bank},${z.riskLevel},${z.scourDepthM},"${z.threatenedInfrastructure}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sediment_audit_${river.id}_${activeEpoch}_${theme.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
      <div
        className="border w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{
          backgroundColor: theme.ui.dockBg,
          borderColor: theme.ui.border,
          color: theme.ui.textPrimary,
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4 border-b"
          style={{ backgroundColor: theme.ui.headerBg, borderColor: theme.ui.border }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="p-1.5 rounded-lg border"
              style={{
                backgroundColor: theme.ui.tagBg,
                borderColor: theme.ui.accent,
                color: theme.ui.accent,
              }}
            >
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm" style={{ color: theme.ui.textPrimary }}>
                Sediment & Morphometry Audit Dossier
              </h3>
              <p className="text-[11px]" style={{ color: theme.ui.textMuted }}>
                {river.name} — {currentEpoch.label} ({theme.name} Mode)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors hover:bg-slate-800/30"
            style={{ color: theme.ui.textMuted }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Executive Summary */}
          <div
            className="p-3.5 rounded-lg border"
            style={{
              backgroundColor: theme.ui.cardBg,
              borderColor: theme.ui.border,
            }}
          >
            <div className="font-semibold mb-1 flex items-center gap-2" style={{ color: theme.ui.textPrimary }}>
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>Morphometric Executive Assessment</span>
            </div>
            <p className="text-[11px] leading-relaxed" style={{ color: theme.ui.textSecondary }}>
              {river.description}
            </p>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div
              className="p-3 border rounded-lg"
              style={{ backgroundColor: theme.ui.cardBg, borderColor: theme.ui.border }}
            >
              <span className="text-[11px] block" style={{ color: theme.ui.textMuted }}>
                Gross Bed Scour:
              </span>
              <span className="text-sm font-bold font-mono text-red-500">
                {(river.sedimentBudget.grossErosionM3 / 1000000).toFixed(2)} M m³
              </span>
            </div>
            <div
              className="p-3 border rounded-lg"
              style={{ backgroundColor: theme.ui.cardBg, borderColor: theme.ui.border }}
            >
              <span className="text-[11px] block" style={{ color: theme.ui.textMuted }}>
                Gross Deposition:
              </span>
              <span className="text-sm font-bold font-mono" style={{ color: theme.ui.accent }}>
                {(river.sedimentBudget.grossDepositionM3 / 1000000).toFixed(2)} M m³
              </span>
            </div>
            <div
              className="p-3 border rounded-lg"
              style={{ backgroundColor: theme.ui.cardBg, borderColor: theme.ui.border }}
            >
              <span className="text-[11px] block" style={{ color: theme.ui.textMuted }}>
                Net Silt Balance:
              </span>
              <span className="text-sm font-bold font-mono" style={{ color: theme.ui.textPrimary }}>
                {river.sedimentBudget.netSedimentBalanceM3 > 0 ? '+' : ''}
                {(river.sedimentBudget.netSedimentBalanceM3 / 1000000).toFixed(2)} M m³
              </span>
            </div>
            <div
              className="p-3 border rounded-lg"
              style={{ backgroundColor: theme.ui.cardBg, borderColor: theme.ui.border }}
            >
              <span className="text-[11px] block" style={{ color: theme.ui.textMuted }}>
                Specific Yield:
              </span>
              <span className="text-sm font-bold font-mono text-amber-500">
                {river.sedimentBudget.specificYieldTonnesPerSqKmYr} t/km²/yr
              </span>
            </div>
            <div
              className="p-3 border rounded-lg"
              style={{ backgroundColor: theme.ui.cardBg, borderColor: theme.ui.border }}
            >
              <span className="text-[11px] block" style={{ color: theme.ui.textMuted }}>
                Annual Silt Load:
              </span>
              <span className="text-sm font-bold font-mono" style={{ color: theme.ui.textPrimary }}>
                {river.annualSedimentYieldMillionTonnes} MT/yr
              </span>
            </div>
            <div
              className="p-3 border rounded-lg"
              style={{ backgroundColor: theme.ui.cardBg, borderColor: theme.ui.border }}
            >
              <span className="text-[11px] block" style={{ color: theme.ui.textMuted }}>
                Lateral Migration:
              </span>
              <span className="text-sm font-bold font-mono text-red-500">
                {river.sedimentBudget.lateralMigrationRateMPerYr} m/year
              </span>
            </div>
          </div>

          {/* High Priority Embankment Alerts */}
          <div>
            <div
              className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5"
              style={{ color: theme.ui.textPrimary }}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
              <span>Priority Bank Protection Zones</span>
            </div>
            <div className="space-y-1.5">
              {river.vulnerabilityZones.map((z) => (
                <div
                  key={z.id}
                  className="p-2.5 rounded border flex justify-between items-center"
                  style={{
                    backgroundColor: theme.ui.cardBg,
                    borderColor: theme.ui.border,
                  }}
                >
                  <div>
                    <span className="font-semibold" style={{ color: theme.ui.textPrimary }}>
                      {z.name}
                    </span>
                    <span className="text-[11px] block" style={{ color: theme.ui.textMuted }}>
                      Threat: {z.threatenedInfrastructure}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-500/20 text-red-500 border border-red-500/40">
                      {z.riskLevel} (Scour: {z.scourDepthM}m)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          className="flex items-center justify-between p-4 border-t"
          style={{ backgroundColor: theme.ui.headerBg, borderColor: theme.ui.border }}
        >
          <span className="text-[11px]" style={{ color: theme.ui.textMuted }}>
            Compliant with Central Water Commission (CWC) River Morphometry Standards.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:underline"
              style={{ color: theme.ui.textSecondary }}
            >
              Close
            </button>
            <button
              onClick={handleDownloadCSV}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 shadow-lg transition-all"
              style={{ backgroundColor: theme.ui.accent }}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV Dossier</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
