// карточки каталога выезжают волной: по очереди поднимаются до состояния ховера и опускаются на место.
// Уходят тоже по очереди, но быстрее. Сама анимация в ModelCard.astro (data-wave), здесь только кто и когда.
const CARD = '[data-catalog-category]';
let run = 0;

// проверяем при вызове: модуль импортирует остров фильтра, а он рендерится и на сервере, где matchMedia нет
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

function play(cards: HTMLElement[], wave: 'in' | 'out') {
  cards.forEach((card, i) => {
    card.removeAttribute('data-wave');
    card.style.setProperty('--wave-i', String(i));
  });
  // перерисовка, чтобы анимация запустилась заново, даже если значение то же
  void document.body.offsetWidth;
  cards.forEach((card) => (card.dataset.wave = wave));
  return Promise.all(cards.flatMap((card) => card.getAnimations().map((a) => a.finished))).catch(() => {});
}

// первое появление: карточки ждут невидимыми, пока сетка не доедет до экрана
export function waveOnView(grid: HTMLElement) {
  if (reducedMotion()) return;
  const cards = [...grid.querySelectorAll<HTMLElement>(CARD)];
  cards.forEach((card) => (card.dataset.wave = 'pending'));

  const observer = new IntersectionObserver(
    ([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      // фильтр мог успеть показать карточки раньше, их не трогаем
      play(cards.filter((card) => !card.hidden && card.dataset.wave === 'pending'), 'in');
    },
    { rootMargin: '0px 0px -15% 0px' },
  );
  observer.observe(grid);
}

// фильтр: видимые карточки уезжают, потом нужные выезжают; частые клики не наслаиваются
export async function waveFilter(section: Element, shown: (card: HTMLElement) => boolean) {
  const id = ++run;
  const cards = [...section.querySelectorAll<HTMLElement>(CARD)];

  if (!reducedMotion()) {
    const leaving = cards.filter((card) => !card.hidden && card.dataset.wave !== 'pending' && card.dataset.wave !== 'out');
    await play(leaving, 'out');
    if (id !== run) return;
  }

  cards.forEach((card) => (card.hidden = !shown(card)));
  if (!reducedMotion()) play(cards.filter((card) => !card.hidden), 'in');
}
