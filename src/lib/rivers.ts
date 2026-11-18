import {
  bufferLine,
  lengthKm,
  lerpLine,
  meanderize,
  shiftLine,
  smoothstep,
  type LonLat,
} from './geo';

export { lerpLine };

export type ChannelKind = 'cutoff' | 'avulsion' | 'braid' | 'engineered';

export type RiverId = 'ghaggar' | 'kosi' | 'teesta' | 'ganga' | 'mahanadi' | 'kaveri';

export type RiverCase = {
  id: RiverId;
  name: string;
  localName?: string;
  region: string;
  kind: ChannelKind;
  eventYear: number;
  era: [number, number];
  eventLabel: string;
  lede: string;
  essay: string;
  view: { center: [number, number]; zoom: number; pitch: number; bearing: number };
  lost: LonLat[];
  born: LonLat[];
  scars: LonLat[][];
  lostLoops: LonLat[][];
  widthKm: number;
  displaced?: string;
  sedimentYieldMT?: number;
  netBudgetM3?: number;
};

const ghaggarLost: LonLat[] = [
  [77.22, 30.48],
  [76.9, 30.32],
  [76.5, 30.18],
  [76.05, 29.95],
  [75.5, 29.7],
  [75.03, 29.53],
  [74.55, 29.52],
  [74.32, 29.58],
  [73.9, 29.32],
  [73.4, 29.18],
  [72.85, 29.08],
  [72.2, 28.92],
  [71.33, 28.77],
  [70.7, 28.35],
  [70.05, 27.65],
];

const yamunaBorn: LonLat[] = [
  [77.22, 30.48],
  [77.45, 30.1],
  [77.2, 29.65],
  [77.22, 28.9],
  [77.45, 28.15],
  [78.02, 27.18],
  [78.6, 26.45],
  [79.45, 25.75],
  [80.35, 25.45],
  [81.85, 25.43],
];

const sutlejScar: LonLat[] = [
  [77.05, 31.15],
  [76.55, 31.0],
  [75.85, 30.9],
  [75.15, 31.13],
  [74.4, 30.95],
  [73.7, 30.55],
  [72.9, 30.15],
];

const kosiHead: LonLat[] = [
  [87.17, 26.87],
  [87.08, 26.72],
  [86.96, 26.54],
];

const kosiOld: LonLat[] = [
  ...kosiHead,
  [86.93, 26.38],
  [86.9, 26.2],
  [86.86, 26.02],
  [86.83, 25.84],
  [86.8, 25.66],
  [86.78, 25.5],
  [86.92, 25.43],
  [87.22, 25.4],
];

const kosiNew: LonLat[] = [
  ...kosiHead,
  [87.12, 26.46],
  [87.28, 26.32],
  [87.4, 26.14],
  [87.48, 25.94],
  [87.5, 25.74],
  [87.46, 25.56],
  [87.36, 25.44],
  [87.22, 25.39],
];

const teestaHead: LonLat[] = [
  [88.5, 27.2],
  [88.48, 26.9],
  [88.58, 26.7],
  [88.73, 26.52],
];

const teestaOld: LonLat[] = [
  ...teestaHead,
  [88.9, 26.15],
  [89.1, 25.85],
  [89.25, 25.55],
  [89.35, 25.15],
  [89.4, 24.85],
  [89.55, 24.45],
  [89.75, 24.05],
];

const teestaNew: LonLat[] = [
  ...teestaHead,
  [88.95, 26.3],
  [89.25, 26.05],
  [89.45, 25.8],
  [89.67, 25.52],
];

const gangaHead: LonLat[] = [
  [87.25, 25.25],
  [87.6, 25.02],
  [87.92, 24.8],
];

const hooghly: LonLat[] = meanderize(
  [
    ...gangaHead,
    [88.08, 24.45],
    [88.16, 24.1],
    [88.25, 23.7],
    [88.34, 23.4],
    [88.36, 23.05],
    [88.22, 22.55],
    [88.08, 22.1],
    [88.02, 21.7],
  ],
  2.2,
  28,
  0.4,
);

const padma: LonLat[] = [
  ...gangaHead,
  [88.25, 24.65],
  [88.6, 24.35],
  [89.0, 24.1],
  [89.45, 23.8],
  [89.8, 23.55],
  [90.25, 23.25],
  [90.55, 22.95],
];

const mahanadiHead: LonLat[] = [
  [83.95, 21.52],
  [84.35, 21.15],
  [84.85, 20.82],
  [85.4, 20.55],
  [85.88, 20.46],
];

const mahanadiOld: LonLat[] = [
  ...mahanadiHead,
  [86.15, 20.42],
  [86.4, 20.35],
  [86.58, 20.3],
  [86.72, 20.26],
];

const deviBorn: LonLat[] = meanderize(
  [
    ...mahanadiHead,
    [85.98, 20.28],
    [86.15, 20.08],
    [86.28, 19.9],
    [86.38, 19.78],
  ],
  1.4,
  18,
  0.8,
);

const kaveriHead: LonLat[] = [
  [78.35, 11.4],
  [78.65, 11.05],
  [78.82, 10.83],
];

const kaveriOld: LonLat[] = [
  ...kaveriHead,
  [79.1, 10.82],
  [79.35, 10.78],
  [79.6, 10.88],
  [79.85, 11.12],
];

const kollidam: LonLat[] = [
  ...kaveriHead,
  [79.05, 10.95],
  [79.3, 11.1],
  [79.55, 11.25],
  [79.82, 11.36],
];

export const RIVERS: RiverCase[] = [
  {
    id: 'ghaggar',
    name: 'Ghaggar–Hakra',
    localName: 'Saraswati',
    region: 'Haryana, Rajasthan, Cholistan',
    kind: 'avulsion',
    eventYear: -1900,
    era: [-4000, 2026],
    eventLabel: 'Perennial flow lost, c. 1900 BCE',
    lede: 'The river that left its bed in the desert and never came back.',
    essay:
      'The Ghaggar–Hakra is the dry scar of a river that once ran from the Siwalik foothills across Haryana and Rajasthan into Cholistan. Its eastern feed was captured by the Yamuna, which now joins the Ganga at Prayagraj. Its western feed was captured by the Sutlej, which now joins the Indus. By about 1900 BCE the long bed no longer reached the sea. What remains is a seasonal nala, a line of Harappan towns, and a paleochannel you can still read from the air. The bright thread on this map is the Yamuna — the channel that was made when this one was lost.',
    view: { center: [74.6, 29.2], zoom: 7.0, pitch: 22, bearing: 8 },
    lost: ghaggarLost,
    born: yamunaBorn,
    scars: [sutlejScar, shiftLine(ghaggarLost, 20, 28), shiftLine(ghaggarLost, 200, 22)],
    lostLoops: [],
    widthKm: 3.2,
    sedimentYieldMT: 45,
    netBudgetM3: -18500000,
  },
  {
    id: 'kosi',
    name: 'Kosi',
    localName: 'Sorrow of Bihar',
    region: 'Nepal / Bihar',
    kind: 'avulsion',
    eventYear: 2008,
    era: [1890, 2026],
    eventLabel: 'Kusaha breach, 18 August 2008',
    lede: 'In one monsoon the river jumped a hundred kilometres across its own fan.',
    essay:
      'The Kosi leaves the Himalaya and builds a megafan 150 km wide. It has occupied many beds across that fan. Embankments tried to pin it to one. On 18 August 2008 the eastern bund failed at Kusaha. The river left a channel it had used for more than a century and tore southeast through settled Bihar — a new bed, uninvited. About three million people were displaced. The faint threads are older courses. 2008 was not an exception. It was the latest rewrite.',
    view: { center: [87.15, 25.95], zoom: 8.5, pitch: 28, bearing: 8 },
    lost: kosiOld,
    born: kosiNew,
    scars: [shiftLine(kosiOld, 90, 18), shiftLine(kosiOld, 80, 36), shiftLine(kosiOld, 270, 14)],
    lostLoops: [],
    widthKm: 1.6,
    displaced: '3 million',
    sedimentYieldMT: 128,
    netBudgetM3: 25800000,
  },
  {
    id: 'teesta',
    name: 'Teesta',
    localName: 'Tista',
    region: 'Sikkim, North Bengal, Bangladesh',
    kind: 'avulsion',
    eventYear: 1787,
    era: [1650, 2026],
    eventLabel: 'Flood avulsion, 1787',
    lede: 'A flood took the Teesta away from the Ganga and gave it to the Brahmaputra.',
    essay:
      'Until 1787 the Teesta came off the Sikkim hills, passed Jalpaiguri, and ran south through the Karatoya and Atrai into the Ganga. That monsoon it broke east. The new bed met the Brahmaputra near Chilmari. The old course shrunk into the Karatoya, a river that still carries the name of a channel the Teesta abandoned. One flood redrew the drainage of North Bengal.',
    view: { center: [89.15, 25.85], zoom: 7.8, pitch: 30, bearing: -8 },
    lost: teestaOld,
    born: teestaNew,
    scars: [shiftLine(teestaOld, 80, 12)],
    lostLoops: [],
    widthKm: 0.9,
    sedimentYieldMT: 72,
    netBudgetM3: 14200000,
  },
  {
    id: 'ganga',
    name: 'Ganga',
    localName: 'Bhagirathi–Hooghly and Padma',
    region: 'West Bengal / Bangladesh',
    kind: 'avulsion',
    eventYear: 1700,
    era: [1500, 2026],
    eventLabel: 'Mainstem shift to the Padma',
    lede: 'The river that built Kolkata kept most of its water for the Padma.',
    essay:
      'For centuries the main Ganga spilled down the Bhagirathi–Hooghly, past Murshidabad and what became Kolkata, to the Bay of Bengal. The discharge drifted east. The Padma, through Rajshahi and Goalundo, became the living mainstem; the Hooghly was left a diminished distributary. The Farakka Barrage, finished in 1975, was built to push water back into the old bed so the port would not silt shut. The lost channel is still a river. It is no longer the river.',
    view: { center: [88.7, 23.7], zoom: 7.0, pitch: 24, bearing: 6 },
    lost: hooghly,
    born: padma,
    scars: [shiftLine(hooghly, 70, 14)],
    lostLoops: [],
    widthKm: 2.4,
    sedimentYieldMT: 380,
    netBudgetM3: 11300000,
  },
  {
    id: 'mahanadi',
    name: 'Mahanadi',
    localName: 'Devi mouth',
    region: 'Chhattisgarh and Odisha',
    kind: 'avulsion',
    eventYear: 1850,
    era: [1750, 2026],
    eventLabel: 'Flood share shifts into the Devi',
    lede: 'A river born in Chhattisgarh argues with its own delta.',
    essay:
      'The Mahanadi rises in the hills of Chhattisgarh, crosses the Hirakud gorge, and reaches the sea in a fan of mouths below Cuttack. The old main thread runs east to Paradeep. Over the last two centuries a growing share of the flood has taken the Devi south to Astaranga, leaving the Paradeep branch with less of the water that cut it. Naraj and the anicuts try to ration what the river already decided. The lost bed and the new one leave the same barrage and disagree about the Bay.',
    view: { center: [85.7, 20.35], zoom: 8.5, pitch: 36, bearing: -12 },
    lost: mahanadiOld,
    born: deviBorn,
    scars: [],
    lostLoops: [],
    widthKm: 0.85,
    sedimentYieldMT: 62,
    netBudgetM3: -4300000,
  },
  {
    id: 'kaveri',
    name: 'Kaveri',
    localName: 'Kollidam',
    region: 'Tamil Nadu',
    kind: 'engineered',
    eventYear: 1830,
    era: [1780, 2026],
    eventLabel: 'Coleroon capture, anicut rebuilt',
    lede: 'The flood wanted the Kollidam. The anicut kept the Kaveri.',
    essay:
      'Below the Grand Anicut the Kaveri splits. The northern branch, the Kollidam or Coleroon, is the steeper flood path. By the early 19th century it was taking the river, and the southern Kaveri — the bed that feeds the delta — was silting. Engineers rebuilt the anicut to push water back into the old course. The new bed is the one the river prefers. The lost bed is the one the delta cannot afford to lose. Both still reach the sea, a few kilometres apart, carrying an argument that started under the Cholas.',
    view: { center: [79.25, 11.05], zoom: 9.0, pitch: 34, bearing: 10 },
    lost: kaveriOld,
    born: kollidam,
    scars: [],
    lostLoops: [],
    widthKm: 0.55,
    sedimentYieldMT: 28,
    netBudgetM3: -8100000,
  },
];

export const RIVER_BY_ID: Record<RiverId, RiverCase> = Object.fromEntries(
  RIVERS.map((r) => [r.id, r]),
) as Record<RiverId, RiverCase>;

export const KIND_LABEL: Record<ChannelKind, string> = {
  cutoff: 'Meander cutoff',
  avulsion: 'Avulsion',
  braid: 'Braid migration',
  engineered: 'Engineered channel',
};

export function morphT(river: RiverCase, year: number) {
  const [a, b] = river.era;
  const span = Math.max(12, (b - a) * 0.12);
  const t0 = river.eventYear - span * 0.35;
  const t1 = river.eventYear + span * 0.65;
  return smoothstep((year - t0) / (t1 - t0));
}

export function riverStats(river: RiverCase) {
  const lostKm = lengthKm(river.lost);
  const bornKm = lengthKm(river.born);
  const delta = bornKm - lostKm;
  return {
    lostKm,
    bornKm,
    deltaKm: delta,
    loops: river.lostLoops.length,
    t: morphT(river, river.eventYear),
  };
}

export function formatKm(n: number) {
  if (Math.abs(n) >= 100) return `${Math.round(n)} km`;
  if (Math.abs(n) >= 10) return `${n.toFixed(0)} km`;
  return `${n.toFixed(1)} km`;
}

export function formatYear(year: number) {
  const y = Math.round(year);
  if (y < 0) return `${Math.abs(y)} BCE`;
  return `${y}`;
}
