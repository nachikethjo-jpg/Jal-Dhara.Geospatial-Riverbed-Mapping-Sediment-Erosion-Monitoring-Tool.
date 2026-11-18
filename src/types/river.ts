export type RiverId = 'kosi' | 'brahmaputra' | 'ganga' | 'mahanadi' | 'kaveri';

export type SurveyEpoch = '2019_pre' | '2021_post' | '2023_flood' | '2024_post' | '2026_current';

export interface SurveyEpochInfo {
  id: SurveyEpoch;
  label: string;
  season: 'Pre-Monsoon' | 'Monsoon Peak' | 'Post-Monsoon';
  year: number;
  waterLevelOffset: number; // in meters relative to datum
  description: string;
}

export interface GaugeStation {
  id: string;
  name: string;
  chainageKm: number;
  lat: number;
  lng: number;
  warningLevelM: number;
  dangerLevelM: number;
  hflM: number; // Highest Flood Level
  currentStageM: number;
  dischargeCumec: number; // m3/s
  sedimentConcentrationGpl: number; // grams per liter
  status: 'normal' | 'warning' | 'critical';
}

export interface VulnerabilityZone {
  id: string;
  name: string;
  chainageStartKm: number;
  chainageEndKm: number;
  bank: 'Left Bank' | 'Right Bank' | 'Both Banks';
  riskLevel: 'Severe' | 'High' | 'Moderate';
  scourDepthM: number;
  threatenedInfrastructure: string;
  mitigationMeasures: string;
  lat: number;
  lng: number;
}

export interface CrossSectionPoint {
  offsetM: number; // distance from left bank in meters
  elevation2019: number; // elevation in meters above MSL
  elevation2026: number; // current elevation in meters
  waterLevelM: number;
}

export interface CrossSectionProfile {
  chainageKm: number;
  label: string;
  widthM: number;
  maxScourM: number;
  thalwegShiftM: number;
  points: CrossSectionPoint[];
}

export interface VolumetricBudget {
  grossErosionM3: number;
  grossDepositionM3: number;
  netSedimentBalanceM3: number;
  specificYieldTonnesPerSqKmYr: number;
  avgChannelAggradationM: number;
  lateralMigrationRateMPerYr: number;
}

export interface RiverReachData {
  id: RiverId;
  name: string;
  hindiName: string;
  basin: string;
  reachName: string;
  state: string;
  centerCoordinates: {
    lat: number;
    lng: number;
  };
  defaultZoom: number;
  reachLengthKm: number;
  avgChannelWidthM: number;
  sinuosityIndex: number;
  braidingIndex: number;
  sedimentType: string;
  annualSedimentYieldMillionTonnes: number;
  morphologyType: 'Braided Megafan' | 'Anabranching Braided' | 'Alluvial Meandering' | 'Deltaic Distributary' | 'Regulated Alluvial';
  description: string;
  geomorphicSignificance: string;
  epochs: SurveyEpochInfo[];
  stations: GaugeStation[];
  vulnerabilityZones: VulnerabilityZone[];
  crossSections: CrossSectionProfile[];
  sedimentBudget: VolumetricBudget;
}
