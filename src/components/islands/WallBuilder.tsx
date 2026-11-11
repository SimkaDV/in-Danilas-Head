import { useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent } from 'react';
import { builderStyles, builderText as t, builderWall, frameSystem } from '@/data/gallery';
import { STYLES, Wall, seededRandom, type Orientation, type Place, type Style } from '@/scripts/frames/layout';
import './CaseTabs.css';
import './WallBuilder.css';

type Frame = Place & { id: number };
type StyleChoice = Style | 'any';
type Note = { text: string; warn?: boolean } | null;

interface Saved {
  W: number;
  H: number;
  frames: Place[];
}

interface Fav extends Saved {
  id: string;
  name: string;
  created: number;
}

const STATE_KEY = 'gallery-builder-v1';
const FAVS_KEY = 'gallery-builder-favs';
// поле вокруг стены во viewBox, чтобы обводка и магниты у края не обрезались
const PAD = 2;
// задержка перед тяжёлыми подсчётами (раскладки, доступные стили), пока размер ещё меняют
const COUNT_DELAY = 200;
// столько мс максимум на подсчёт раскладок и на проверку стилей, чтобы большая стена не подвешивала страницу
const COUNT_BUDGET = 250;
// проверка стиля для бледной таблетки – меньше попыток, чем у настоящей раскладки
const CHECK_TRIES = 8;
// со стольких рамок от максимума «Любой» сначала пробует «Сетку»
const DENSE = 0.75;

const makeWall = (W: number, H: number, random?: () => number) =>
  new Wall({ ...frameSystem, width: W, height: H }, random);
const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, Math.round(v)));
const styleLabel = (id: StyleChoice) => builderStyles.find((s) => s.id === id)?.label ?? id;
const withIds = (list: Place[]): Frame[] => list.map((f, n) => ({ o: f.o, i: f.i, j: f.j, id: n + 1 }));
const fmt = (v: number) => String(Math.round(v * 10) / 10).replace('.', ',');

// localStorage может не работать (приватный режим), поэтому всё в try
function readJson<T>(key: string): T | null {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null') as T | null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // без сохранения тоже работает
  }
}

// стартовая раскладка с зерном: на сервере и в браузере выходит одна и та же
function initialFrames() {
  const wall = makeWall(builderWall.width, builderWall.height, seededRandom(1));
  const n = Math.min(builderWall.frames, wall.maxLayout().length);
  return withIds(wall.tryStyle('bands', n) ?? wall.maxLayout().slice(0, n));
}

// раскладывает n рамок выбранным стилем; «Любой» перебирает стили, кроме прошлого
function layout(wall: Wall, n: number, choice: StyleChoice, last: Style | null) {
  if (choice !== 'any') {
    const list = wall.tryStyle(choice, n);
    return list ? { list, style: choice } : null;
  }
  const order: Style[] = STYLES.filter((s) => s !== 'grid' && s !== last).sort(() => Math.random() - 0.5);
  // почти полную стену складывает только «Сетка», остальные долго ищут и не находят
  if (n > wall.maxLayout().length * DENSE) order.unshift('grid');
  else order.push('grid');
  for (const s of order) {
    const list = wall.tryStyle(s, n);
    if (list) return { list, style: s };
  }
  return null;
}

// переносит рамки на новую сетку: каждая встаёт на ближайшее свободное место
function refit(prev: Frame[], from: Wall, to: Wall) {
  const out: Frame[] = [];
  for (const f of prev) {
    const c = from.center(f);
    const other: Orientation = f.o === 'v' ? 'h' : 'v';
    const p = to.nearestPlace(f.o, c.x, c.y, out) ?? to.nearestPlace(other, c.x, c.y, out);
    if (p) out.push({ ...p, id: f.id });
  }
  return out;
}

export default function WallBuilder() {
  const [W, setW] = useState(builderWall.width);
  const [H, setH] = useState(builderWall.height);
  const [frames, setFrames] = useState<Frame[]>(initialFrames);
  const [style, setStyle] = useState<StyleChoice>('any');
  const [sel, setSel] = useState<number | null>(null);
  const [note, setNote] = useState<Note>(null);
  const [unique, setUnique] = useState<{ count: number; partial: boolean } | null>(null);
  const [blocked, setBlocked] = useState<Set<Style>>(new Set());
  const [favs, setFavs] = useState<Fav[]>([]);
  const [favName, setFavName] = useState('');
  const [favNote, setFavNote] = useState('');
  const [renaming, setRenaming] = useState<string | null>(null);
  const [armed, setArmed] = useState<string | null>(null);

  const wall = useMemo(() => makeWall(W, H), [W, H]);
  const max = useMemo(() => wall.maxLayout().length, [wall]);
  const svg = useRef<SVGSVGElement>(null);
  const lastStyle = useRef<Style | null>('bands');
  // рамки, добавленные кнопкой «+», по порядку: «−» убирает их с конца
  const added = useRef<number[]>([]);
  const drag = useRef<{ id: number; sx: number; sy: number; i: number; j: number; moved: boolean } | null>(null);
  const loaded = useRef(false);
  const n = frames.length;
  const nextId = () => Math.max(0, ...frames.map((f) => f.id)) + 1;

  // при первом заходе в браузере – прошлая стена и избранное
  useEffect(() => {
    const saved = readJson<Saved>(STATE_KEY);
    if (saved && Array.isArray(saved.frames)) {
      const w = clamp(+saved.W || builderWall.width, builderWall.minWidth, builderWall.maxWidth);
      const h = clamp(+saved.H || builderWall.height, builderWall.minHeight, builderWall.maxHeight);
      const sw = makeWall(w, h);
      const list: Frame[] = [];
      for (const f of saved.frames) {
        const p = { o: f.o, i: +f.i, j: +f.j };
        if ((p.o === 'v' || p.o === 'h') && sw.inArea(p) && !sw.collides(p, list)) list.push({ ...p, id: list.length + 1 });
      }
      setW(w);
      setH(h);
      setFrames(list);
    }
    const stored = readJson<Fav[]>(FAVS_KEY);
    if (Array.isArray(stored)) setFavs(stored);
    loaded.current = true;
  }, []);

  useEffect(() => {
    if (loaded.current) writeJson(STATE_KEY, { W, H, frames: frames.map(({ o, i, j }) => ({ o, i, j })) });
  }, [W, H, frames]);

  // сколько раскладок находится и какие стили складываются – после паузы, это сотни попыток
  useEffect(() => {
    setUnique(null);
    const timer = window.setTimeout(() => {
      const count = n || Math.min(builderWall.frames, max);
      setUnique(wall.countUnique(count, COUNT_BUDGET));
      // не успели проверить стиль – считаем, что он складывается
      const until = Date.now() + COUNT_BUDGET;
      setBlocked(new Set(STYLES.filter((s) => Date.now() < until && !wall.tryStyle(s, count, CHECK_TRIES))));
    }, COUNT_DELAY);
    return () => clearTimeout(timer);
  }, [wall, n, max]);

  // --- действия ---

  function randomize(choice = style, count = n || Math.min(builderWall.frames, max)) {
    if (!max) return setNote({ text: t.noRoom, warn: true });
    const res = layout(wall, Math.min(count, max), choice, lastStyle.current);
    if (!res) return setNote({ text: t.styleFailed(styleLabel(choice)), warn: true });
    lastStyle.current = res.style;
    added.current = [];
    setFrames(withIds(res.list));
    setSel(null);
    setNote({ text: t.styleUsed(styleLabel(res.style)) });
  }

  function pickStyle(id: StyleChoice) {
    setStyle(id);
    randomize(id);
  }

  function addFrame() {
    if (n >= max) return;
    const free = wall.freePlaces(frames);
    if (!free.length) return randomize(style, n + 1);
    const id = nextId();
    added.current.push(id);
    setFrames([...frames, { ...free[0], id }]);
    setSel(id);
    setNote(null);
  }

  function removeFrame(id?: number) {
    if (!n) return;
    let target = id;
    if (target == null) {
      while (added.current.length && target == null) {
        const last = added.current.pop()!;
        if (frames.some((f) => f.id === last)) target = last;
      }
      target ??= frames[frames.length - 1].id;
    }
    added.current = added.current.filter((x) => x !== target);
    setFrames(frames.filter((f) => f.id !== target));
    setSel(null);
    setNote(null);
  }

  function rotate(id: number) {
    const f = frames.find((x) => x.id === id);
    if (!f) return;
    const others = frames.filter((x) => x.id !== id);
    const c = wall.center(f);
    const o: Orientation = f.o === 'v' ? 'h' : 'v';
    const p = wall.nearestPlace(o, c.x, c.y, others);
    // повёрнутая рамка встаёт рядом, но не дальше пары шагов сетки
    if (!p || Math.hypot(wall.center(p).x - c.x, wall.center(p).y - c.y) > wall.P * 2) {
      return setNote({ text: t.cantRotate, warn: true });
    }
    setFrames(frames.map((x) => (x.id === id ? { ...p, id } : x)));
    setNote(null);
  }

  function resize(nW: number, nH: number) {
    const w = clamp(nW, builderWall.minWidth, builderWall.maxWidth);
    const h = clamp(nH, builderWall.minHeight, builderWall.maxHeight);
    if (w === W && h === H) return;
    const next = makeWall(w, h);
    const nextMax = next.maxLayout().length;
    let list = refit(frames, wall, next);
    const want = Math.min(n, nextMax);
    if (list.length < want) {
      const res = layout(next, want, style, lastStyle.current) ?? layout(next, want, 'any', null);
      list = res ? withIds(res.list) : withIds(next.maxLayout().slice(0, want));
      added.current = [];
    }
    setW(w);
    setH(h);
    setFrames(list);
    setSel(null);
    setNote(n > nextMax ? { text: nextMax ? t.shrunk(nextMax) : t.noRoom, warn: true } : null);
  }

  // --- перетаскивание по шайбам ---

  function toWall(e: { clientX: number; clientY: number }) {
    const el = svg.current!;
    const pt = el.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    return pt.matrixTransform(el.getScreenCTM()!.inverse());
  }

  function onPointerDown(e: ReactPointerEvent<SVGSVGElement>) {
    const g = (e.target as Element).closest<SVGGElement>('[data-frame]');
    if (!g) return setSel(null);
    const f = frames.find((x) => x.id === +g.dataset.frame!);
    if (!f) return;
    const p = toWall(e);
    drag.current = { id: f.id, sx: p.x, sy: p.y, i: f.i, j: f.j, moved: false };
    try {
      svg.current!.setPointerCapture(e.pointerId);
    } catch {
      // указатель уже отпущен – тянуть нечего
    }
  }

  function onPointerMove(e: ReactPointerEvent<SVGSVGElement>) {
    const d = drag.current;
    if (!d) return;
    const f = frames.find((x) => x.id === d.id);
    if (!f) return;
    const p = toWall(e);
    let cand: Place = { o: f.o, i: d.i + Math.round((p.x - d.sx) / wall.P), j: d.j + Math.round((p.y - d.sy) / wall.P) };
    if (!wall.inArea(cand)) {
      const c = wall.center(cand);
      const near = wall.nearestPlace(f.o, c.x, c.y);
      if (!near) return;
      cand = near;
    }
    if (cand.i === f.i && cand.j === f.j) return;
    // на занятое место рамка не встаёт, остаётся на последнем свободном
    if (wall.collides(cand, frames.filter((x) => x.id !== d.id))) return;
    d.moved = true;
    setFrames(frames.map((x) => (x.id === d.id ? { ...cand, id: d.id } : x)));
  }

  function onPointerUp() {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    setSel(d.moved ? d.id : sel === d.id ? null : d.id);
    if (d.moved) setNote(null);
  }

  useEffect(() => {
    if (sel == null) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest('input, textarea')) return;
      if ('rRкК'.includes(e.key) && e.key.length === 1) rotate(sel);
      else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        removeFrame(sel);
      } else if (e.key === 'Escape') setSel(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  // --- избранное ---

  function saveFavs(list: Fav[]) {
    setFavs(list);
    writeJson(FAVS_KEY, list);
  }

  function addFav() {
    if (!n) return;
    const name = favName.trim() || t.favDefaultName(favs.length + 1);
    const created = Date.now();
    saveFavs([{ id: String(created), name, created, W, H, frames: frames.map(({ o, i, j }) => ({ o, i, j })) }, ...favs]);
    setFavName('');
    setFavNote(t.favSaved(name));
    window.setTimeout(() => setFavNote(''), 2500);
  }

  function applyFav(fav: Fav) {
    const w = clamp(fav.W, builderWall.minWidth, builderWall.maxWidth);
    const h = clamp(fav.H, builderWall.minHeight, builderWall.maxHeight);
    const fw = makeWall(w, h);
    const list: Frame[] = [];
    for (const f of fav.frames) if (fw.inArea(f) && !fw.collides(f, list)) list.push({ ...f, id: list.length + 1 });
    added.current = [];
    setW(w);
    setH(h);
    setFrames(list);
    setSel(null);
    setNote({ text: t.favApplied(fav.name) });
  }

  function renameFav(fav: Fav, name: string) {
    setRenaming(null);
    const clean = name.trim();
    if (clean && clean !== fav.name) saveFavs(favs.map((x) => (x.id === fav.id ? { ...x, name: clean } : x)));
  }

  function deleteFav(fav: Fav) {
    if (armed !== fav.id) {
      setArmed(fav.id);
      window.setTimeout(() => setArmed((a) => (a === fav.id ? null : a)), 3000);
      return;
    }
    setArmed(null);
    saveFavs(favs.filter((x) => x.id !== fav.id));
  }

  // --- отрисовка ---

  const used = new Set(frames.flatMap((f) => wall.magnets(f).map(([i, j]) => `${i},${j}`)));
  const vb = { x: -PAD, y: -PAD, w: W + PAD * 2, h: H + PAD * 2 };
  const selFrame = frames.find((f) => f.id === sel) ?? null;
  const box = n ? wall.bbox(frames) : null;
  const pv = wall.places.filter((p) => p.o === 'v').length;
  const shownNote: Note = note ?? (max && n >= max ? { text: t.atMax(W, H, max) } : null);

  const dots = [];
  if (wall.ok) {
    for (let i = 0; i < wall.nx; i++) {
      for (let j = 0; j < wall.ny; j++) {
        const [x, y] = wall.dot(i, j);
        dots.push(<circle key={`${i},${j}`} cx={x} cy={y} r={0.9} className="builder__dot" />);
      }
    }
  }

  const stats: [string, string][] = [
    [String(wall.nx * wall.ny), t.statDots(wall.nx, wall.ny)],
    [`${fmt(wall.s)}×${fmt(wall.s)}`, t.statMagnets],
    [`${pv} / ${wall.places.length - pv}`, t.statPlaces],
    [unique == null ? '…' : `${unique.partial ? '≥ ' : ''}${unique.count}`, t.statUnique(n || Math.min(builderWall.frames, max))],
    [String(n), t.statFrames(used.size)],
    [box ? `${fmt(box.x2 - box.x)}×${fmt(box.y2 - box.y)}` : '–', t.statSize],
  ];

  return (
    <div className="builder">
      <div className="builder__head">
        <h2 className="builder__title">{t.title}</h2>
        <p className="builder__lead">{t.lead}</p>
      </div>

      <div className="builder__panel">
        <div className="builder__stage">
          <Stepper
            className="builder__size builder__size--height"
            label={t.height}
            value={H}
            min={builderWall.minHeight}
            max={builderWall.maxHeight}
            plus={t.taller}
            minus={t.shorter}
            onChange={(v) => resize(W, v)}
            vertical
          />
          <div className="builder__wall" style={{ '--wall-width': W } as CSSProperties}>
            <div className="builder__canvas">
              <svg
                ref={svg}
                className="builder__svg"
                viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
                role="img"
                aria-label={`${t.wallLabel}: ${W}×${H} ${t.cm}, ${n}`}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={() => (drag.current = null)}
              >
                <rect x={0} y={0} width={W} height={H} rx={1} className="builder__area" />
                <g>{dots}</g>
                {frames.map((f) => {
                  const r = wall.rect(f);
                  return (
                    <g key={f.id} data-frame={f.id} className="builder__frame" aria-selected={f.id === sel}>
                      <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={0.5} className="builder__frame-body" />
                      <rect
                        x={r.x + 1.2}
                        y={r.y + 1.2}
                        width={r.w - 2.4}
                        height={r.h - 2.4}
                        className={`builder__frame-photo builder__frame-photo--${f.o}`}
                      />
                      {wall.magnets(f).map(([i, j]) => {
                        const [x, y] = wall.dot(i, j);
                        return <circle key={`${i},${j}`} cx={x} cy={y} r={0.75} className="builder__magnet" />;
                      })}
                    </g>
                  );
                })}
              </svg>
              {selFrame && (
                <FrameTools
                  rect={wall.rect(selFrame)}
                  vb={vb}
                  onRotate={() => rotate(selFrame.id)}
                  onRemove={() => removeFrame(selFrame.id)}
                />
              )}
            </div>
          </div>
          <Stepper
            className="builder__size builder__size--width"
            label={t.width}
            value={W}
            min={builderWall.minWidth}
            max={builderWall.maxWidth}
            plus={t.longer}
            minus={t.narrower}
            onChange={(v) => resize(v, H)}
          />
        </div>
      </div>

      <div className="builder__controls">
        <div className="builder__counter" role="group" aria-label={t.framesLabel}>
          <span className="builder__counter-label">{t.framesLabel}</span>
          <button type="button" className="builder__round" aria-label={t.removeFrame} disabled={!n} onClick={() => removeFrame()}>
            −
          </button>
          <output className="builder__count" aria-live="polite">
            {n} <span>{t.framesOf(max)}</span>
          </output>
          <button type="button" className="builder__round" aria-label={t.addFrame} disabled={n >= max} onClick={addFrame}>
            +
          </button>
        </div>

        <div className="case-tabs builder__styles" role="group" aria-label={t.stylesLabel}>
          {builderStyles.map((s) => (
            <button
              key={s.id}
              type="button"
              className="case-tabs__pill"
              data-scroll-lift
              aria-pressed={s.id === style}
              data-blocked={s.id !== 'any' && blocked.has(s.id) ? '' : undefined}
              onClick={() => pickStyle(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>

        <button type="button" className="builder__go" data-scroll-lift onClick={() => randomize()}>
          {t.randomize}
        </button>
      </div>

      <p className="builder__note" data-warn={shownNote?.warn ? '' : undefined} aria-live="polite" hidden={!shownNote}>
        {shownNote?.text}
      </p>

      <ul className="builder__stats">
        {stats.map(([value, label]) => (
          <li key={label} className="builder__stat">
            <b>{value}</b>
            <span>{label}</span>
          </li>
        ))}
      </ul>

      <details className="builder__favs">
        <summary className="builder__favs-summary">
          {t.favTitle} <span>({favs.length})</span>
        </summary>
        <div className="builder__favs-body">
          <div className="builder__favs-add">
            <input
              className="builder__input"
              value={favName}
              placeholder={t.favName}
              maxLength={60}
              onChange={(e) => setFavName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addFav()}
            />
            <button type="button" className="builder__small builder__small--accent" disabled={!n} onClick={addFav}>
              ★ {t.favSave}
            </button>
            <span className="builder__favs-note">{favNote || t.favNote}</span>
          </div>
          {favs.length ? (
            <ul className="builder__favs-list">
              {favs.map((fav) => (
                <li key={fav.id} className="builder__fav">
                  <button type="button" className="builder__fav-preview" aria-label={`${t.favApply}: ${fav.name}`} onClick={() => applyFav(fav)}>
                    <Mini fav={fav} />
                  </button>
                  {renaming === fav.id ? (
                    <input
                      className="builder__input"
                      defaultValue={fav.name}
                      maxLength={60}
                      autoFocus
                      onBlur={(e) => renameFav(fav, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') renameFav(fav, e.currentTarget.value);
                        if (e.key === 'Escape') setRenaming(null);
                      }}
                    />
                  ) : (
                    <b className="builder__fav-name">{fav.name}</b>
                  )}
                  <span className="builder__fav-meta">{t.favMeta(fav.frames.length, fav.W, fav.H)}</span>
                  <div className="builder__fav-actions">
                    <button type="button" className="builder__small builder__small--accent" onClick={() => applyFav(fav)}>
                      {t.favApply}
                    </button>
                    <button type="button" className="builder__small" onClick={() => setRenaming(fav.id)}>
                      {t.favRename}
                    </button>
                    <button type="button" className="builder__small" onClick={() => deleteFav(fav)}>
                      {armed === fav.id ? t.favDeleteConfirm : t.favDelete}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="builder__favs-empty">{t.favEmpty}</p>
          )}
        </div>
      </details>
    </div>
  );
}

// размер стены: ± с зажатием (повторяет, пока держишь) и поле для точного числа
function Stepper(props: {
  className: string;
  label: string;
  value: number;
  min: number;
  max: number;
  plus: string;
  minus: string;
  onChange: (v: number) => void;
  vertical?: boolean;
}) {
  const { className, label, value, min, max, plus, minus, onChange, vertical } = props;
  const [draft, setDraft] = useState(String(value));
  const hold = useRef<{ t1?: number; t2?: number }>({});
  const latest = useRef(onChange);
  const current = useRef(value);
  latest.current = onChange;
  current.current = value;

  useEffect(() => setDraft(String(value)), [value]);
  useEffect(() => stop, []);

  function stop() {
    clearTimeout(hold.current.t1);
    clearInterval(hold.current.t2);
  }

  function start(d: number) {
    const act = () => latest.current(current.current + d);
    act();
    hold.current.t1 = window.setTimeout(() => (hold.current.t2 = window.setInterval(act, 70)), 400);
  }

  const commit = () => {
    const v = Number(draft.replace(',', '.'));
    if (Number.isFinite(v) && v > 0) onChange(v);
    else setDraft(String(value));
  };

  const button = (d: number, text: string, aria: string, disabled: boolean) => (
    <button
      type="button"
      className="builder__round"
      aria-label={aria}
      disabled={disabled}
      onPointerDown={(e) => {
        e.preventDefault();
        start(d);
      }}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onChange(value + d)}
    >
      {text}
    </button>
  );

  const up = button(builderWall.step, '+', plus, value >= max);
  const down = button(-builderWall.step, '−', minus, value <= min);

  return (
    <div className={className} data-vertical={vertical ? '' : undefined} role="group" aria-label={label}>
      <span className="builder__size-label">{label}</span>
      {vertical ? up : down}
      <input
        className="builder__input builder__size-input"
        inputMode="numeric"
        value={draft}
        aria-label={`${label}, ${t.cm}`}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === 'Enter' && commit()}
      />
      {vertical ? down : up}
      <span className="builder__size-label">{t.cm}</span>
    </div>
  );
}

// плашка над выбранной рамкой: повернуть и убрать
function FrameTools(props: {
  rect: { x: number; y: number; w: number; h: number };
  vb: { x: number; y: number; w: number; h: number };
  onRotate: () => void;
  onRemove: () => void;
}) {
  const { rect, vb, onRotate, onRemove } = props;
  const style = {
    left: `${((rect.x + rect.w / 2 - vb.x) / vb.w) * 100}%`,
    top: `${((rect.y + rect.h / 2 - vb.y) / vb.h) * 100}%`,
  };
  return (
    <div className="builder__tools" style={style}>
      <button type="button" className="builder__tool" aria-label={t.rotate} title={t.rotate} onClick={onRotate}>
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M13 8a5 5 0 1 1-1.5-3.6M13 2v3h-3" />
        </svg>
      </button>
      <button type="button" className="builder__tool" aria-label={t.remove} title={t.remove} onClick={onRemove}>
        <svg viewBox="0 0 16 16" aria-hidden="true">
          <path d="M4 4l8 8M12 4l-8 8" />
        </svg>
      </button>
    </div>
  );
}

// мини-превью раскладки в избранном
function Mini({ fav }: { fav: Fav }) {
  const w = makeWall(fav.W, fav.H);
  return (
    <svg viewBox={`-1 -1 ${fav.W + 2} ${fav.H + 2}`} aria-hidden="true">
      <rect x={0} y={0} width={fav.W} height={fav.H} rx={1} className="builder__area" />
      {fav.frames.map((f, n) => {
        const r = w.rect(f);
        return (
          <g key={n}>
            <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={0.5} className="builder__frame-body" />
            <rect
              x={r.x + 1.2}
              y={r.y + 1.2}
              width={r.w - 2.4}
              height={r.h - 2.4}
              className={`builder__frame-photo builder__frame-photo--${f.o}`}
            />
          </g>
        );
      })}
    </svg>
  );
}
