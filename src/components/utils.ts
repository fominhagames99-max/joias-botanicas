import type { DishTier } from "./types";

const SPACING = 1.35;
const CURVE = 0.95;
const BAND = 1.22;
const TILT = 0.8;
const SLAT = 0.34;
const LIFT_Y = -6;
const LIFT_SCALE = 0.08;
const BACK_SHADE = 0.15;
const CHIP_ROOM = 34;
const WIDE = 1024;
const HOLD = 1400;
const RUN = 0;
const SEEK = 1;
const DRAG = 2;

const TIERS = [
  { ring: "border-chart-1", dot: "bg-chart-1" },
  { ring: "border-chart-2", dot: "bg-chart-2" },
  { ring: "border-chart-3", dot: "bg-chart-3" },
  { ring: "border-chart-4", dot: "bg-chart-4" },
  { ring: "border-chart-5", dot: "bg-chart-5" },
] as const;

export const DEFAULT_LABELS: SushiConveyorMenuLabels = {
  add: "Adicionar ao pedido",
  close: "Fechar",
  previous: "Prato anterior",
  next: "Próximo prato",
  pause: "Pausar esteira",
};

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function tierStyle(tier: number | undefined) {
  return TIERS[clamp(Math.round(tier ?? 1), 1, 5) - 1] ?? TIERS[0];
}

export interface Geo {
  width: number;
  height: number;
  d: number;
  r: number;
  s: number;
  l: number;
  pitch: number;
  n: number;
  kb: number;
  cx: number;
  ym: number;
  a: number;
  b: number;
  band: number;
  slats: number;
  side: number;
  edgeTop: number;
}

export interface Point {
  x: number;
  z: number;
  nx: number;
  nz: number;
  tx: number;
  tz: number;
}

export interface Sim {
  offset: number;
  v: number;
  mode: number;
  target: number;
  lift: number[];
  vlift: number[];
  z: number[];
  lane: string[];
  raf: number;
  last: number;
  visible: boolean;
  init: boolean;
  touched: boolean;
  l: number;
  center: number;
  published: string;
  px: number;
  py: number;
  inside: boolean;
  lock: boolean;
  lockX: number;
  lockY: number;
}

export function makeSim(): Sim {
  return {
    offset: 0,
    v: 0,
    mode: RUN,
    target: 0,
    lift: [],
    vlift: [],
    z: [],
    lane: [],
    raf: 0,
    last: 0,
    visible: true,
    init: false,
    touched: false,
    l: 0,
    center: -1,
    published: "",
    px: 0,
    py: 0,
    inside: false,
    lock: false,
    lockX: 0,
    lockY: 0,
  };
}

export function along(g: Geo, u: number): Point {
  const { s, r } = g;
  let t = ((u % g.l) + g.l) % g.l;
  if (t < s)
    return { x: s / 2 - t, z: r, nx: 0, nz: 1, tx: -1, tz: 0 };
  t -= s;
  const arc = Math.PI * r;
  if (t < arc) {
    const f = t / r;
    const sin = Math.sin(f);
    const cos = Math.cos(f);
    return {
      x: -s / 2 - r * sin,
      z: r * cos,
      nx: -sin,
      nz: cos,
      tx: -cos,
      tz: -sin,
    };
  }
  t -= arc;
  if (t < s)
    return { x: -s / 2 + t, z: -r, nx: 0, nz: -1, tx: 1, tz: 0 };
  t -= s;
  const f = Math.min(Math.PI, t / r);
  const sin = Math.sin(f);
  const cos = Math.cos(f);
  return {
    x: s / 2 + r * sin,
    z: -r * cos,
    nx: sin,
    nz: -cos,
    tx: cos,
    tz: sin,
  };
}

export function project(g: Geo, x: number, z: number) {
  const k = g.a + g.b * z;
  return {
    x: g.cx + x * k,
    y: g.ym + TILT * (g.a * z + (g.b * z * z) / 2),
    k,
  };
}

export function makeGeo(width: number, n: number, d: number, kb: number): Geo {
  const l = Math.max(1, n) * SPACING * d;
  const r = Math.min(CURVE * d, l / (2 * Math.PI));
  const s = Math.max(0, (l - 2 * Math.PI * r) / 2);
  const g: Geo = {
    width,
    height: 0,
    d,
    r,
    s,
    l,
    pitch: l / Math.max(1, n),
    n: Math.max(1, n),
    kb,
    cx: width / 2,
    ym: 0,
    a: (1 + kb) / 2,
    b: (1 - kb) / (2 * r),
    band: BAND * d,
    slats: Math.max(10, Math.round(l / (SLAT * d))),
    side: Math.max(3, d * 0.07),
    edgeTop: 0,
  };
  let top = Infinity;
  let bottom = -Infinity;
  let edge = Infinity;
  for (let j = 0; j < 120; j++) {
    const p = along(g, (j / 120) * l);
    const rim = project(g, p.x + (p.nx * g.band) / 2, p.z + (p.nz * g.band) / 2);
    const plate = project(g, p.x, p.z);
    const half = (plate.k * d * TILT) / 2;
    edge = Math.min(edge, rim.y);
    top = Math.min(
      top,
      rim.y,
      plate.y + (LIFT_Y / 100) * half * 2 - half * (1 + LIFT_SCALE) - CHIP_ROOM
    );
    bottom = Math.max(
      bottom,
      rim.y + g.side + d * 0.06,
      plate.y + half + d * 0.08
    );
  }
  g.ym = Math.ceil(-top) + 2;
  g.height = Math.ceil(bottom - top) + 4;
  g.edgeTop = edge + g.ym;
  return g;
}

export function halfSpan(g: Geo): number {
  let span = 0;
  for (let j = 0; j < 120; j++) {
    const p = along(g, (j / 120) * g.l);
    const rim = project(g, p.x + (p.nx * g.band) / 2, p.z + (p.nz * g.band) / 2);
    const plate = project(g, p.x, p.z);
    span = Math.max(
      span,
      Math.abs(rim.x - g.cx) + 3,
      Math.abs(plate.x - g.cx) + (plate.k * g.d * (1 + LIFT_SCALE)) / 2
    );
  }
  return span;
}

export function edgePath(g: Geo, offset: number): string {
  let d = "";
  const steps = 168;
  for (let j = 0; j < steps; j++) {
    const p = along(g, (j / steps) * g.l);
    const q = project(g, p.x + p.nx * offset, p.z + p.nz * offset);
    d += `${j ? "L" : "M"}${q.x.toFixed(1)} ${q.y.toFixed(1)}`;
  }
  return `${d}Z`;
}

export function slatPath(g: Geo, offset: number, shift: number): string {
  const half = g.band * 0.46;
  const pitch = g.l / g.slats;
  const bulge = pitch * 0.2;
  let d = "";
  for (let j = 0; j < g.slats; j++) {
    const p = along(g, offset + shift + j * pitch);
    const inner = project(g, p.x - p.nx * half, p.z - p.nz * half);
    const outer = project(g, p.x + p.nx * half, p.z + p.nz * half);
    const mid = project(g, p.x + p.tx * bulge, p.z + p.tz * bulge);
    d += `M${inner.x.toFixed(1)} ${inner.y.toFixed(1)}Q${(2 * mid.x - (inner.x + outer.x) / 2).toFixed(1)} ${(2 * mid.y - (inner.y + outer.y) / 2).toFixed(1)} ${outer.x.toFixed(1)} ${outer.y.toFixed(1)}`;
  }
  return d;
}

export function pose(g: Geo, offset: number, i: number) {
  const p = along(g, offset - i * g.pitch);
  const q = project(g, p.x, p.z);
  return {
    x: q.x,
    y: q.y,
    k: q.k,
    depth: (p.z + g.r) / (2 * g.r),
  };
}

export function centerOf(g: Geo, offset: number): number {
  return (
    ((Math.round((offset - g.s / 2) / g.pitch) % g.n) + g.n) % g.n
  );
}

export function legendEntries(
  items: ConveyorDish[],
  legend: { [tier: number]: string } | undefined
) {
  const out: { tier: number; label: string }[] = [];
  for (let tier = 1; tier <= 5; tier++) {
    const label = legend
      ? legend[tier]
      : items.find((item) => (item.tier ?? 1) === tier)?.price;
    if (label) out.push({ tier, label });
  }
  return out;
}

export function pad(value: number): string {
  return String(value).padStart(2, "0");
}

import type { SushiConveyorMenuLabels } from "./types";