// поднимает кнопки с data-scroll-lift, пока они в «зоне внимания»: на таче под большим пальцем, с мышью посередине экрана.
// Ставит data-lifted, а стили поднятой кнопки общие с :hover и :focus-visible, поэтому два источника не складываются.
const TOUCH_ZONE = '-55% 0px -15% 0px';
const MOUSE_ZONE = '-35% 0px -35% 0px';

const touch = matchMedia('(hover: none)');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const timers = new Map<Element, number>();
let observer: IntersectionObserver | undefined;

// шаг задержки берём из токена --lift-stagger (в секундах)
function staggerMs() {
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--lift-stagger')) * 1000 || 0;
}

function drop(el: Element) {
  clearTimeout(timers.get(el));
  timers.delete(el);
  el.removeAttribute('data-lifted');
}

function start() {
  observer?.disconnect();
  document.querySelectorAll('[data-lifted]').forEach(drop);
  if (reducedMotion.matches) return;

  const step = staggerMs();
  observer = new IntersectionObserver(
    (entries) => {
      // кнопки, вошедшие в зону разом (ряд таблеток), поднимаются по очереди слева направо
      entries
        .filter((entry) => entry.isIntersecting)
        .map((entry) => entry.target)
        .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
        .forEach((el, i) => {
          clearTimeout(timers.get(el));
          timers.set(el, window.setTimeout(() => el.setAttribute('data-lifted', ''), step * i));
        });

      entries.filter((entry) => !entry.isIntersecting).forEach((entry) => drop(entry.target));
    },
    { rootMargin: touch.matches ? TOUCH_ZONE : MOUSE_ZONE },
  );
  document.querySelectorAll('[data-scroll-lift]').forEach((el) => observer?.observe(el));
}

start();
touch.addEventListener('change', start);
reducedMotion.addEventListener('change', start);
