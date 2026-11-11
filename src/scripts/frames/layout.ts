// Движок раскладок рамок на сетке шайб (перенесён из «Планировщика галереи в коридоре»).
// Все размеры в сантиметрах, начало координат – левый верхний угол области.
// Шайбы стоят ровной сеткой с шагом pitch по центру области, магниты в рамке – квадратом
// под шаг сетки, поэтому рамка садится на четыре шайбы и вертикально, и горизонтально.

export type Orientation = 'v' | 'h';
export type Style = 'bands' | 'wave' | 'mirror' | 'salon' | 'line' | 'grid';

export interface Place {
  o: Orientation;
  /** столбец и ряд левой верхней шайбы под рамкой */
  i: number;
  j: number;
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface WallConfig {
  /** длина и высота области */
  width: number;
  height: number;
  pitch: number;
  /** минимальный зазор между рамками */
  gap: number;
  /** размер рамки стоя (вертикально) */
  frameWidth: number;
  frameHeight: number;
  /** от края рамки до магнита не меньше этого */
  magnetInset?: number;
}

export const STYLES: Style[] = ['bands', 'wave', 'mirror', 'salon', 'line', 'grid'];

const E = 1e-6;
const DEFAULT_INSET = 1.5;

// генератор случайных чисел с зерном: одинаковая раскладка на сервере и в браузере
export function seededRandom(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Item = { o: Orientation; t: number; track?: number; same?: boolean };

export class Wall {
  readonly W: number;
  readonly H: number;
  readonly P: number;
  readonly G: number;
  readonly FW: number;
  readonly FH: number;
  /** шайб по длине и по высоте */
  readonly nx: number;
  readonly ny: number;
  readonly x0: number;
  readonly y0: number;
  /** сторона квадрата магнитов и она же в шагах сетки */
  readonly s: number;
  readonly k: number;
  /** магниты помещаются в рамку */
  readonly ok: boolean;
  /** все позиции, где рамка целиком в области */
  readonly places: Place[] = [];
  private readonly byOJ = new Map<string, Place[]>();
  random: () => number;

  constructor(cfg: WallConfig, random: () => number = Math.random) {
    this.W = cfg.width;
    this.H = cfg.height;
    this.P = cfg.pitch;
    this.G = cfg.gap;
    this.FW = cfg.frameWidth;
    this.FH = cfg.frameHeight;
    this.random = random;
    const P = this.P;
    this.nx = Math.max(1, Math.floor(this.W / P + E));
    this.ny = Math.max(1, Math.floor(this.H / P + E));
    this.x0 = (this.W - (this.nx - 1) * P) / 2;
    this.y0 = (this.H - (this.ny - 1) * P) / 2;
    const inset = cfg.magnetInset ?? DEFAULT_INSET;
    this.s = Math.floor((Math.min(this.FW, this.FH) - 2 * inset) / P + E) * P;
    this.k = Math.round(this.s / P);
    this.ok = this.k >= 1;
    if (!this.ok) return;
    for (const o of ['v', 'h'] as const) {
      for (let j = 0; j + this.k <= this.ny - 1; j++) {
        for (let i = 0; i + this.k <= this.nx - 1; i++) {
          const f = { o, i, j };
          if (!this.inArea(f)) continue;
          this.places.push(f);
          const key = o + j;
          if (!this.byOJ.has(key)) this.byOJ.set(key, []);
          this.byOJ.get(key)!.push(f);
        }
      }
    }
  }

  private pick<T>(list: T[]) {
    return list[Math.floor(this.random() * list.length)];
  }

  dims(o: Orientation) {
    return o === 'v' ? { w: this.FW, h: this.FH } : { w: this.FH, h: this.FW };
  }

  dot(i: number, j: number): [number, number] {
    return [this.x0 + i * this.P, this.y0 + j * this.P];
  }

  center(f: Place) {
    return { x: this.x0 + f.i * this.P + this.s / 2, y: this.y0 + f.j * this.P + this.s / 2 };
  }

  rect(f: Place): Rect {
    const c = this.center(f);
    const d = this.dims(f.o);
    return { x: c.x - d.w / 2, y: c.y - d.h / 2, w: d.w, h: d.h };
  }

  /** четыре шайбы, на которых висит рамка */
  magnets(f: Place): [number, number][] {
    const k = this.k;
    return [
      [f.i, f.j],
      [f.i + k, f.j],
      [f.i, f.j + k],
      [f.i + k, f.j + k],
    ];
  }

  inArea(f: Place) {
    if (!this.ok) return false;
    const r = this.rect(f);
    return (
      f.i >= 0 &&
      f.j >= 0 &&
      f.i + this.k <= this.nx - 1 &&
      f.j + this.k <= this.ny - 1 &&
      r.x >= -E &&
      r.y >= -E &&
      r.x + r.w <= this.W + E &&
      r.y + r.h <= this.H + E
    );
  }

  private hit(a: Rect, b: Rect, g: number) {
    return a.x < b.x + b.w + g - E && b.x < a.x + a.w + g - E && a.y < b.y + b.h + g - E && b.y < a.y + a.h + g - E;
  }

  /** рамка f ближе зазора к кому-то из list (сама с собой не сравнивается) */
  collides(f: Place, list: Place[], g = this.G) {
    return list.some((o) => o !== f && this.hit(this.rect(f), this.rect(o), g));
  }

  nearestPlace(o: Orientation, cx: number, cy: number, avoid: Place[] = []) {
    let best: Place | null = null;
    let bd = Infinity;
    for (const p of this.places) {
      if (p.o !== o || this.collides(p, avoid)) continue;
      const c = this.center(p);
      const d = (c.x - cx) ** 2 + (c.y - cy) ** 2;
      if (d < bd) {
        bd = d;
        best = p;
      }
    }
    return best;
  }

  /** свободные позиции, ближайшие к центру области – первыми */
  freePlaces(list: Place[]) {
    const cx = this.W / 2;
    const cy = this.H / 2;
    const dist = (p: Place) => Math.hypot(this.center(p).x - cx, this.center(p).y - cy);
    return this.places.filter((p) => !this.collides(p, list)).sort((a, b) => dist(a) - dist(b));
  }

  bbox(list: Place[]) {
    const rs = list.map((f) => this.rect(f));
    return {
      x: Math.min(...rs.map((r) => r.x)),
      y: Math.min(...rs.map((r) => r.y)),
      x2: Math.max(...rs.map((r) => r.x + r.w)),
      y2: Math.max(...rs.map((r) => r.y + r.h)),
    };
  }

  valid(list: Place[] | null): list is Place[] {
    return !!list && list.every((f) => this.inArea(f)) && list.every((f) => !this.collides(f, list, this.G - E));
  }

  // --- максимум рамок ---

  // жадно раскладывает рамки построчно; order – в каком порядке перебирать позиции
  private pack(order: Place[]) {
    const out: Place[] = [];
    for (const p of order) if (!this.collides(p, out)) out.push({ ...p });
    return out;
  }

  /**
   * Сколько рамок максимум помещается в область, и одна такая раскладка.
   * При шаге 12 и зазоре 3 любая рамка занимает на сетке квадрат 2×2 шага,
   * поэтому плотная укладка по рядам из разных углов и с разной ориентацией первой находит максимум.
   */
  maxLayout(): Place[] {
    if (!this.ok || !this.places.length) return [];
    const flip = (p: Place, fx: boolean, fy: boolean) => ({
      key: (fy ? -p.j : p.j) * 1e4 + (fx ? -p.i : p.i),
    });
    let best: Place[] = [];
    for (const first of ['v', 'h'] as const) {
      for (const fx of [false, true]) {
        for (const fy of [false, true]) {
          const order = [...this.places].sort((a, b) => {
            const d = flip(a, fx, fy).key - flip(b, fx, fy).key;
            if (d) return d;
            return (a.o === first ? 0 : 1) - (b.o === first ? 0 : 1);
          });
          const out = this.pack(order);
          if (out.length > best.length) best = out;
        }
      }
    }
    return best;
  }

  // --- генераторы стилей ---

  private oriSeq(n: number) {
    const a: Orientation[] = [];
    for (let i = 0; i < n; i++) {
      let o: Orientation = this.random() < 0.5 ? 'v' : 'h';
      if (i >= 2 && a[i - 1] === a[i - 2]) o = a[i - 1] === 'v' ? 'h' : 'v';
      a.push(o);
    }
    return a;
  }

  // ряд сетки, центр которого ближе всего к высоте t
  private levelJ(o: Orientation, t: number) {
    let best: number | null = null;
    let bd = Infinity;
    for (let j = 0; j < this.ny; j++) {
      if (!this.byOJ.has(o + j)) continue;
      const cy = this.y0 + j * this.P + this.s / 2;
      const d = Math.abs(cy - t);
      if (d < bd - E || (Math.abs(d - bd) < E && this.random() < 0.5)) {
        bd = d;
        best = j;
      }
    }
    return best;
  }

  // ставит рамки слева направо на заданные высоты, каждая дорожка (track) идёт своим ходом
  private seqPlace(items: Item[]) {
    const out: Place[] = [];
    const minX: Record<number, number> = {};
    let prev: Place | null = null;
    for (const it of items) {
      const j = this.levelJ(it.o, it.t);
      if (j == null) return null;
      const list = this.byOJ.get(it.o + j)!;
      let got: Place | null = null;
      if (it.same && prev) {
        const f = { o: it.o, i: prev.i, j };
        if (this.inArea(f) && !this.collides(f, out)) got = f;
      }
      if (!got) {
        const mx = minX[it.track ?? 0] ?? -Infinity;
        for (const p of list) {
          const f = { ...p };
          if (this.center(f).x > mx + E && !this.collides(f, out)) {
            got = f;
            break;
          }
        }
      }
      if (!got) return null;
      out.push(got);
      minX[it.track ?? 0] = this.center(got).x;
      prev = got;
    }
    return out;
  }

  private waveTypes(n: number) {
    type T = 'v' | 'hu' | 'hd' | 'hh';
    const ts: T[] = [];
    const len: Record<T, number> = { v: 1, hu: 1, hd: 1, hh: 2 };
    let rem = n;
    while (rem > 0) {
      const prev = ts[ts.length - 1];
      let opts: T[];
      if (!prev) opts = rem >= 2 ? ['v', 'hh'] : ['v'];
      else if (prev === 'v') opts = rem >= 2 ? ['hu', 'hd', 'hh'] : ['hu', 'hd'];
      else if (prev === 'hu') opts = ['v', 'hd'];
      else if (prev === 'hd') opts = ['v', 'hu'];
      else opts = ['v'];
      const t = this.pick(opts);
      ts.push(t);
      rem -= len[t];
    }
    return ts;
  }

  // по одной рамке к центру композиции; pairMirror – парами зеркально от середины
  private scoreGreedy(n: number, pairMirror: boolean) {
    const out: Place[] = [];
    const cx0 = this.W / 2;
    const cy0 = this.H / 2;
    const mir = (f: Place): Place => ({ o: f.o, i: this.nx - 1 - this.k - f.i, j: f.j });
    while (out.length < n) {
      let best: { p: Place; partner: Place | null } | null = null;
      let bs = Infinity;
      const cen = out.length
        ? {
            x: out.reduce((a, f) => a + this.center(f).x, 0) / out.length,
            y: out.reduce((a, f) => a + this.center(f).y, 0) / out.length,
          }
        : { x: cx0, y: cy0 };
      for (const p of this.places) {
        if (this.collides(p, out)) continue;
        const c = this.center(p);
        let partner: Place | null = null;
        if (pairMirror) {
          const m = mir(p);
          const self = m.i === p.i;
          if (n - out.length === 1 && !self) continue;
          if (!self) {
            if (!this.inArea(m) || this.collides(m, out) || this.hit(this.rect(p), this.rect(m), this.G)) continue;
            partner = m;
          }
        }
        const ref = pairMirror ? { x: cx0, y: cy0 } : cen;
        const fl = Math.min(c.y - this.dims(p.o).h / 2, this.H - c.y - this.dims(p.o).h / 2);
        const sc = Math.abs(c.x - ref.x) + 0.4 * Math.abs(c.y - ref.y) + fl * 0.8 + this.random() * this.P * 2;
        if (sc < bs) {
          bs = sc;
          best = { p, partner };
        }
      }
      if (!best) return null;
      out.push({ ...best.p });
      if (best.partner) out.push(best.partner);
    }
    return out;
  }

  private bands(n: number) {
    const ph = this.random() < 0.5 ? 0 : 1;
    const lv: number[] = [];
    for (let j = 0; j < this.ny; j++) lv.push(this.y0 + j * this.P + this.s / 2);
    type V = { edge?: boolean; a?: number; b?: number; sc: number };
    const vars: V[] = [{ edge: true, sc: this.random() * this.P }];
    for (let a = 0; a < lv.length; a++) {
      for (let b = a + 1; b < lv.length; b++) {
        vars.push({
          a: lv[a],
          b: lv[b],
          sc:
            Math.abs((lv[a] + lv[b]) / 2 - this.H / 2) +
            Math.abs(lv[b] - lv[a] - (this.FW + this.FH) / 2 - this.G) * 0.5 +
            this.random() * this.P,
        });
      }
    }
    vars.sort((x, y) => x.sc - y.sc);
    for (const v of vars.slice(0, 14)) {
      const items: Item[] = [];
      const cnt = [0, 0];
      for (let q = 0; q < n; q++) {
        const r = q % 2;
        const o: Orientation = (cnt[r] + r + ph) % 2 ? 'h' : 'v';
        cnt[r]++;
        const h = this.dims(o).h;
        const t = v.edge ? (r === 0 ? this.H / 2 - this.G / 2 - h / 2 : this.H / 2 + this.G / 2 + h / 2) : r === 0 ? v.a! : v.b!;
        items.push({ o, t, track: r });
      }
      const res = this.seqPlace(items);
      if (res) return res;
    }
    return null;
  }

  private wave(n: number) {
    const jc = this.levelJ('v', this.H / 2);
    if (jc == null) return null;
    const c = this.y0 + jc * this.P + this.s / 2;
    const D = Math.ceil((this.FW + this.G) / this.P - E) * this.P;
    const hu = c - Math.floor(D / this.P / 2) * this.P;
    const hd = hu + D;
    const items: Item[] = [];
    for (const t of this.waveTypes(n)) {
      if (t === 'v') items.push({ o: 'v', t: c });
      else if (t === 'hu') items.push({ o: 'h', t: hu });
      else if (t === 'hd') items.push({ o: 'h', t: hd });
      else {
        items.push({ o: 'h', t: hu });
        items.push({ o: 'h', t: hd, same: true });
      }
    }
    return this.seqPlace(items);
  }

  private line(n: number) {
    return this.seqPlace(this.oriSeq(n).map((o) => ({ o, t: this.H / 2 })));
  }

  private grid(n: number) {
    let best: { sc: number; out: Place[] } | null = null;
    for (const o of ['v', 'h'] as const) {
      const d = this.dims(o);
      const sx = Math.ceil((d.w + this.G) / this.P - E);
      const sy = Math.ceil((d.h + this.G) / this.P - E);
      for (let c = 1; c <= n; c++) {
        const r = Math.ceil(n / c);
        const spI = (c - 1) * sx;
        const spJ = (r - 1) * sy;
        const i0 = Math.floor((this.nx - 1 - this.k - spI) / 2);
        const j0 = Math.floor((this.ny - 1 - this.k - spJ) / 2);
        const out: Place[] = [];
        for (let a = 0; a < n; a++) {
          const row = Math.floor(a / c);
          const col = a % c;
          const inRow = row === r - 1 ? n - c * (r - 1) : c;
          out.push({ o, i: i0 + col * sx + Math.floor(((c - inRow) * sx) / 2), j: j0 + row * sy });
        }
        if (out.every((f) => this.inArea(f))) {
          const sc = Math.abs((spI * this.P) / Math.max(1, spJ * this.P) - this.W / this.H) + (r * c - n) * 0.3;
          if (!best || sc < best.sc) best = { sc, out };
        }
      }
    }
    return best ? best.out : null;
  }

  private generate(style: Style, n: number): Place[] | null {
    switch (style) {
      case 'bands':
        return this.bands(n);
      case 'wave':
        return this.wave(n);
      case 'line':
        return this.line(n);
      case 'salon':
        return this.scoreGreedy(n, false);
      case 'mirror':
        return this.scoreGreedy(n, true);
      case 'grid':
        return this.grid(n);
    }
  }

  // сдвигает композицию к центру области целыми шагами сетки
  private centerIn(list: Place[]) {
    const b = this.bbox(list);
    const want = Math.round(((this.W - (b.x2 - b.x)) / 2 - b.x) / this.P);
    for (const d of [want, want - 1, want + 1, 0]) {
      if (list.every((f) => this.inArea({ ...f, i: f.i + d }))) {
        list.forEach((f) => (f.i += d));
        break;
      }
    }
    const b2 = this.bbox(list);
    const wv = Math.round(((this.H - (b2.y2 - b2.y)) / 2 - b2.y) / this.P);
    for (const d of [wv, wv - 1, wv + 1]) {
      if (list.every((f) => this.inArea({ ...f, j: f.j + d }))) {
        list.forEach((f) => (f.j += d));
        break;
      }
    }
  }

  /**
   * Раскладка n рамок стилем style или null, если за tries попыток не сложилось.
   * budget в мс: на большой стене почти без свободного места одна попытка «Салона» идёт сотни мс.
   */
  tryStyle(style: Style, n: number, tries = 30, budget = 300): Place[] | null {
    if (!this.ok || n < 1) return null;
    const until = Date.now() + budget;
    for (let t = 0; t < tries && Date.now() < until; t++) {
      const l = this.generate(style, n);
      if (!l || l.length !== n) continue;
      if (style !== 'mirror' && style !== 'grid') this.centerIn(l);
      if (this.valid(l)) return l;
    }
    return null;
  }

  /**
   * Сколько разных раскладок на n рамок генератор находит за 300 попыток.
   * budget – сколько мс можно потратить: на большой стене попытки долгие, тогда partial = true.
   */
  countUnique(n: number, budget = Infinity) {
    if (!this.ok || n < 1) return { count: 0, partial: false };
    const seen = new Set<string>();
    const sts = STYLES.filter((s) => s !== 'grid');
    const key = (l: Place[]) => l.map((f) => `${f.o}${f.i}.${f.j}`).sort().join('|');
    const until = Date.now() + budget;
    let partial = false;
    for (let t = 0; t < 300; t++) {
      if (Date.now() > until) {
        partial = true;
        break;
      }
      const st = sts[t % sts.length];
      const l = this.generate(st, n);
      if (!l || l.length !== n) continue;
      if (st !== 'mirror') this.centerIn(l);
      if (this.valid(l)) seen.add(key(l));
    }
    const g = this.grid(n);
    if (this.valid(g)) seen.add(key(g));
    return { count: seen.size, partial };
  }
}
