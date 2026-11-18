export type LonLat = [number, number];

const EARTH_KM = 6371;

export function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

export function toDeg(rad: number) {
  return (rad * 180) / Math.PI;
}

export function destination(from: LonLat, bearingDeg: number, distKm: number): LonLat {
  const δ = distKm / EARTH_KM;
  const θ = toRad(bearingDeg);
  const φ1 = toRad(from[1]);
  const λ1 = toRad(from[0]);
  const φ2 = Math.asin(Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ));
  const λ2 =
    λ1 +
    Math.atan2(Math.sin(θ) * Math.sin(δ) * Math.cos(φ1), Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2));
  return [toDeg(λ2), toDeg(φ2)];
}

export function bearingBetween(a: LonLat, b: LonLat): number {
  const φ1 = toRad(a[1]);
  const φ2 = toRad(b[1]);
  const Δλ = toRad(b[0] - a[0]);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);
  return (toDeg(θ) + 360) % 360;
}

export function haversineKm(a: LonLat, b: LonLat): number {
  const Δφ = toRad(b[1] - a[1]);
  const Δλ = toRad(b[0] - a[0]);
  const φ1 = toRad(a[1]);
  const φ2 = toRad(b[1]);
  const h =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function lengthKm(line: LonLat[]): number {
  let sum = 0;
  for (let i = 1; i < line.length; i++) sum += haversineKm(line[i - 1], line[i]);
  return sum;
}

export function resample(line: LonLat[], n: number): LonLat[] {
  if (line.length === 0) return [];
  if (n <= 1) return [line[0]];
  const seg: number[] = [0];
  for (let i = 1; i < line.length; i++) {
    seg.push(seg[i - 1] + haversineKm(line[i - 1], line[i]));
  }
  const total = seg[seg.length - 1] || 1;
  const out: LonLat[] = [];
  for (let i = 0; i < n; i++) {
    const d = (total * i) / (n - 1);
    let k = 1;
    while (k < seg.length && seg[k] < d) k++;
    const d0 = seg[k - 1];
    const d1 = seg[k] ?? d0;
    const t = d1 === d0 ? 0 : (d - d0) / (d1 - d0);
    const a = line[k - 1];
    const b = line[Math.min(k, line.length - 1)];
    out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
  }
  return out;
}

export function lerpLine(a: LonLat[], b: LonLat[], t: number): LonLat[] {
  const n = Math.max(a.length, b.length, 2);
  const ar = resample(a, n);
  const br = resample(b, n);
  return ar.map((p, i) => [p[0] + (br[i][0] - p[0]) * t, p[1] + (br[i][1] - p[1]) * t]);
}

export function smoothstep(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

function hash01(i: number, salt: number) {
  const x = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export function meanderize(
  path: LonLat[],
  ampKm: number,
  waveKm: number,
  phase = 0,
  harmonics = true,
): LonLat[] {
  const dense = resample(path, Math.max(48, Math.round(lengthKm(path) / Math.max(0.6, waveKm / 10))));
  let dist = 0;
  return dense.map((pt, i) => {
    if (i > 0) dist += haversineKm(dense[i - 1], pt);
    const prev = dense[Math.max(0, i - 1)];
    const next = dense[Math.min(dense.length - 1, i + 1)];
    const bear = bearingBetween(prev, next);
    const wobble = harmonics ? 0.28 * Math.sin((dist / (waveKm * 0.43)) * Math.PI * 2 + phase * 1.7) : 0;
    const noise = (hash01(i, phase * 10) - 0.5) * 0.18;
    const offset = ampKm * (Math.sin((dist / waveKm) * Math.PI * 2 + phase) + wobble + noise);
    return destination(pt, bear + 90, offset);
  });
}

export function shiftLine(line: LonLat[], bearingDeg: number, distKm: number): LonLat[] {
  return line.map((pt) => destination(pt, bearingDeg, distKm));
}

export function bufferLine(coords: LonLat[], widthKm: number): LonLat[] {
  if (coords.length < 2) return [];
  const left: LonLat[] = [];
  const right: LonLat[] = [];
  const half = widthKm / 2;
  for (let i = 0; i < coords.length; i++) {
    const prev = coords[Math.max(0, i - 1)];
    const next = coords[Math.min(coords.length - 1, i + 1)];
    const bear = bearingBetween(prev, next);
    left.push(destination(coords[i], bear - 90, half));
    right.push(destination(coords[i], bear + 90, half));
  }
  const ring = [...left, ...right.reverse()];
  ring.push(ring[0]);
  return ring;
}
