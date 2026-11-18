export type AppTheme = 'sonar' | 'daylight' | 'topographic' | 'thermal';

export interface ThemeConfig {
  id: AppTheme;
  name: string;
  tagline: string;
  isDark: boolean;
  ui: {
    bg: string;
    headerBg: string;
    dockBg: string;
    cardBg: string;
    cardHoverBg: string;
    border: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    accent: string;
    accentGlow: string;
    tagBg: string;
  };
  three: {
    skyColor: number;
    fogDensity: number;
    dirLightColor: number;
    dirLightIntensity: number;
    hemiSkyColor: number;
    hemiGroundColor: number;
    hemiIntensity: number;
    rimLightColor: number;
    rimLightIntensity: number;
    waterColor: number;
    waterOpacity: number;
    waterRoughness: number;
    waterMetalness: number;
    particleColor: number;
    // Terrain base tints: [trench, submerged bar, dry sandbar, bank/floodplain]
    terrainColors: {
      trench: [number, number, number];
      submerged: [number, number, number];
      dryBar: [number, number, number];
      bank: [number, number, number];
    };
    // DoD cut-and-fill tints
    dodColors: {
      scourMax: [number, number, number];
      scourMid: [number, number, number];
      stableBed: [number, number, number];
      accretionMid: [number, number, number];
      accretionMax: [number, number, number];
    };
  };
  mapTypeId: 'satellite' | 'terrain' | 'roadmap' | 'hybrid';
}

export const THEMES: Record<AppTheme, ThemeConfig> = {
  sonar: {
    id: 'sonar',
    name: 'Deep Sonar',
    tagline: 'High-contrast bathymetric acoustics & cut-and-fill neon telemetry',
    isDark: true,
    ui: {
      bg: '#0b0f17',
      headerBg: 'rgba(15, 23, 42, 0.95)',
      dockBg: 'rgba(15, 23, 42, 0.95)',
      cardBg: 'rgba(2, 6, 23, 0.75)',
      cardHoverBg: 'rgba(30, 41, 59, 0.8)',
      border: 'rgba(51, 65, 85, 0.8)',
      textPrimary: '#f8fafc',
      textSecondary: '#cbd5e1',
      textMuted: '#64748b',
      accent: '#06b6d4',
      accentGlow: 'rgba(6, 182, 212, 0.25)',
      tagBg: 'rgba(8, 51, 68, 0.8)',
    },
    three: {
      skyColor: 0x0b111e,
      fogDensity: 0.0035,
      dirLightColor: 0xfff7ed,
      dirLightIntensity: 2.4,
      hemiSkyColor: 0x93c5fd,
      hemiGroundColor: 0x1e293b,
      hemiIntensity: 1.2,
      rimLightColor: 0x38bdf8,
      rimLightIntensity: 0.8,
      waterColor: 0x0284c7,
      waterOpacity: 0.75,
      waterRoughness: 0.15,
      waterMetalness: 0.1,
      particleColor: 0xfbbf24,
      terrainColors: {
        trench: [0.12, 0.25, 0.38],
        submerged: [0.72, 0.64, 0.48],
        dryBar: [0.82, 0.74, 0.58],
        bank: [0.25, 0.38, 0.24],
      },
      dodColors: {
        scourMax: [0.92, 0.12, 0.15],
        scourMid: [0.95, 0.55, 0.12],
        stableBed: [0.55, 0.52, 0.45],
        accretionMid: [0.12, 0.65, 0.92],
        accretionMax: [0.05, 0.85, 0.95],
      },
    },
    mapTypeId: 'satellite',
  },

  daylight: {
    id: 'daylight',
    name: 'Daylight Aerial',
    tagline: 'Natural sunlight, true-color alluvial soils & crystalline waters',
    isDark: false,
    ui: {
      bg: '#f8fafc',
      headerBg: 'rgba(255, 255, 255, 0.95)',
      dockBg: 'rgba(255, 255, 255, 0.95)',
      cardBg: 'rgba(241, 245, 249, 0.9)',
      cardHoverBg: 'rgba(226, 232, 240, 0.9)',
      border: 'rgba(203, 213, 225, 0.9)',
      textPrimary: '#0f172a',
      textSecondary: '#334155',
      textMuted: '#64748b',
      accent: '#0284c7',
      accentGlow: 'rgba(2, 132, 199, 0.2)',
      tagBg: 'rgba(224, 242, 254, 0.9)',
    },
    three: {
      skyColor: 0xbae6fd,
      fogDensity: 0.002,
      dirLightColor: 0xffedd5,
      dirLightIntensity: 3.0,
      hemiSkyColor: 0x7dd3fc,
      hemiGroundColor: 0xa8a29e,
      hemiIntensity: 1.5,
      rimLightColor: 0xffedd5,
      rimLightIntensity: 0.5,
      waterColor: 0x0ea5e9,
      waterOpacity: 0.65,
      waterRoughness: 0.1,
      waterMetalness: 0.05,
      particleColor: 0xd97706,
      terrainColors: {
        trench: [0.22, 0.38, 0.45],
        submerged: [0.82, 0.74, 0.55],
        dryBar: [0.92, 0.86, 0.72],
        bank: [0.35, 0.58, 0.28],
      },
      dodColors: {
        scourMax: [0.85, 0.15, 0.15],
        scourMid: [0.92, 0.50, 0.15],
        stableBed: [0.75, 0.72, 0.65],
        accretionMid: [0.15, 0.60, 0.85],
        accretionMax: [0.08, 0.75, 0.88],
      },
    },
    mapTypeId: 'satellite',
  },

  topographic: {
    id: 'topographic',
    name: 'Topographic Relief',
    tagline: 'Geodetic survey contours, bedrock elevation grading & structural grid',
    isDark: true,
    ui: {
      bg: '#141419',
      headerBg: 'rgba(24, 24, 32, 0.95)',
      dockBg: 'rgba(24, 24, 32, 0.95)',
      cardBg: 'rgba(15, 15, 20, 0.8)',
      cardHoverBg: 'rgba(38, 38, 48, 0.85)',
      border: 'rgba(68, 68, 85, 0.8)',
      textPrimary: '#f4f4f5',
      textSecondary: '#d4d4d8',
      textMuted: '#71717a',
      accent: '#f59e0b',
      accentGlow: 'rgba(245, 158, 11, 0.25)',
      tagBg: 'rgba(69, 26, 3, 0.8)',
    },
    three: {
      skyColor: 0x181820,
      fogDensity: 0.003,
      dirLightColor: 0xfef3c7,
      dirLightIntensity: 2.2,
      hemiSkyColor: 0xfde68a,
      hemiGroundColor: 0x27272a,
      hemiIntensity: 1.1,
      rimLightColor: 0xf59e0b,
      rimLightIntensity: 0.9,
      waterColor: 0x059669,
      waterOpacity: 0.7,
      waterRoughness: 0.2,
      waterMetalness: 0.15,
      particleColor: 0xf59e0b,
      terrainColors: {
        trench: [0.15, 0.18, 0.22],
        submerged: [0.65, 0.58, 0.45],
        dryBar: [0.85, 0.78, 0.62],
        bank: [0.45, 0.42, 0.35],
      },
      dodColors: {
        scourMax: [0.95, 0.20, 0.10],
        scourMid: [0.92, 0.60, 0.10],
        stableBed: [0.48, 0.48, 0.52],
        accretionMid: [0.15, 0.75, 0.55],
        accretionMax: [0.10, 0.90, 0.70],
      },
    },
    mapTypeId: 'terrain',
  },

  thermal: {
    id: 'thermal',
    name: 'Sediment Flux (IR)',
    tagline: 'False-color infrared spectral imagery tracking suspended silt plumes',
    isDark: true,
    ui: {
      bg: '#0a0814',
      headerBg: 'rgba(18, 12, 36, 0.95)',
      dockBg: 'rgba(18, 12, 36, 0.95)',
      cardBg: 'rgba(28, 16, 52, 0.75)',
      cardHoverBg: 'rgba(48, 28, 88, 0.8)',
      border: 'rgba(126, 34, 206, 0.5)',
      textPrimary: '#faf5ff',
      textSecondary: '#e9d5ff',
      textMuted: '#a855f7',
      accent: '#ec4899',
      accentGlow: 'rgba(236, 72, 153, 0.3)',
      tagBg: 'rgba(88, 28, 135, 0.8)',
    },
    three: {
      skyColor: 0x110924,
      fogDensity: 0.0035,
      dirLightColor: 0xfbcfe8,
      dirLightIntensity: 2.6,
      hemiSkyColor: 0xc084fc,
      hemiGroundColor: 0x3b0764,
      hemiIntensity: 1.3,
      rimLightColor: 0xf43f5e,
      rimLightIntensity: 1.0,
      waterColor: 0x8b5cf6,
      waterOpacity: 0.78,
      waterRoughness: 0.18,
      waterMetalness: 0.25,
      particleColor: 0xf43f5e,
      terrainColors: {
        trench: [0.18, 0.08, 0.35],
        submerged: [0.45, 0.18, 0.55],
        dryBar: [0.85, 0.45, 0.25],
        bank: [0.25, 0.15, 0.45],
      },
      dodColors: {
        scourMax: [0.95, 0.05, 0.45], // magenta-rose scour
        scourMid: [0.98, 0.45, 0.15],
        stableBed: [0.35, 0.20, 0.45],
        accretionMid: [0.35, 0.45, 0.95],
        accretionMax: [0.05, 0.85, 0.95],
      },
    },
    mapTypeId: 'hybrid',
  },
};
