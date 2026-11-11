import type { Place, Style } from '@/scripts/frames/layout';

// тексты страницы «Цифровая галерея» (/gallery/)
export const galleryTitle = 'Цифровая галерея – В голове у Даньки';
export const galleryDescription = 'Фотографии в системе магнитных рамок';
export const galleryBackLabel = 'Назад к интересам';
export const galleryBackHref = '/#about';

// система рамок: эти числа не настраиваются в конструкторе, все размеры в см
export const frameSystem = {
  pitch: 12, // шаг шайб на стене
  gap: 3, // минимальный зазор между рамками
  frameWidth: 15, // рамка стоя, временно из шаблона планировщика
  frameHeight: 21,
};

// конструктор «Собери свою стену»
export const builderWall = {
  width: 150, // стартовая стена – как у Даньки в коридоре
  height: 60,
  minWidth: 30,
  maxWidth: 600,
  minHeight: 30,
  maxHeight: 250,
  step: 5, // шаг кнопок ± у размеров
  frames: 8, // сколько рамок в стартовой раскладке
};

export const builderStyles: { id: Style | 'any'; label: string }[] = [
  { id: 'any', label: 'Любой' },
  { id: 'bands', label: 'Две полосы' },
  { id: 'wave', label: 'Волна' },
  { id: 'mirror', label: 'Симметрия' },
  { id: 'salon', label: 'Салон' },
  { id: 'line', label: 'Линия' },
  { id: 'grid', label: 'Сетка' },
];

// раскладки Даньки для превью у конструктора: меняются по кругу, клик открывает конструктор с ней.
// Пока временные из генератора, Данька соберёт свои в конструкторе. Высота стены у всех одна, длина может быть своя.
export interface BuilderPreset {
  name: string;
  W: number;
  H: number;
  frames: Place[];
}

export const builderPresets: BuilderPreset[] = [
  { name: 'Две полосы', W: 150, H: 60, frames: [{ o: 'v', i: 1, j: 1 }, { o: 'h', i: 1, j: 3 }, { o: 'h', i: 3, j: 1 }, { o: 'v', i: 3, j: 3 }, { o: 'v', i: 5, j: 1 }, { o: 'h', i: 5, j: 3 }, { o: 'h', i: 7, j: 1 }, { o: 'v', i: 7, j: 3 }, { o: 'v', i: 9, j: 1 }, { o: 'h', i: 9, j: 3 }] },
  { name: 'Волна', W: 150, H: 60, frames: [{ o: 'h', i: 1, j: 1 }, { o: 'h', i: 1, j: 3 }, { o: 'v', i: 3, j: 2 }, { o: 'h', i: 5, j: 3 }, { o: 'h', i: 6, j: 1 }, { o: 'h', i: 7, j: 3 }, { o: 'h', i: 8, j: 1 }, { o: 'h', i: 9, j: 3 }, { o: 'h', i: 10, j: 1 }] },
  { name: 'Симметрия', W: 150, H: 60, frames: [{ o: 'v', i: 5, j: 3 }, { o: 'v', i: 5, j: 0 }, { o: 'v', i: 7, j: 0 }, { o: 'v', i: 3, j: 0 }, { o: 'v', i: 3, j: 3 }, { o: 'v', i: 7, j: 3 }, { o: 'v', i: 1, j: 0 }, { o: 'v', i: 9, j: 0 }] },
  { name: 'Салон', W: 150, H: 60, frames: [{ o: 'v', i: 4, j: 3 }, { o: 'v', i: 4, j: 0 }, { o: 'v', i: 6, j: 0 }, { o: 'h', i: 6, j: 2 }, { o: 'h', i: 2, j: 1 }, { o: 'h', i: 2, j: 3 }, { o: 'v', i: 8, j: 2 }] },
  { name: 'Сетка', W: 150, H: 60, frames: [{ o: 'v', i: 0, j: 0 }, { o: 'v', i: 2, j: 0 }, { o: 'v', i: 4, j: 0 }, { o: 'v', i: 6, j: 0 }, { o: 'v', i: 8, j: 0 }, { o: 'v', i: 10, j: 0 }, { o: 'v', i: 0, j: 2 }, { o: 'v', i: 2, j: 2 }, { o: 'v', i: 4, j: 2 }, { o: 'v', i: 6, j: 2 }, { o: 'v', i: 8, j: 2 }, { o: 'v', i: 10, j: 2 }] },
];

export const builderPreviewInterval = 4500; // мс между раскладками в превью

export const builderText = {
  title: 'Собери свою стену',
  lead: 'Задай размер свободного места на стене, выбери стиль и перемешивай, пока не понравится. Рамку можно перетащить по шайбам, повернуть или убрать.',
  open: 'Открыть конструктор',
  close: 'Свернуть конструктор',
  previewLabel: (name: string) => `Открыть конструктор с раскладкой «${name}»`,
  wallLabel: 'Стена с рамками',
  height: 'высота',
  width: 'длина',
  cm: 'см',
  taller: 'Выше',
  shorter: 'Ниже',
  longer: 'Длиннее',
  narrower: 'Короче',
  framesLabel: 'Рамок',
  framesOf: (max: number) => `из ${max}`,
  addFrame: 'Добавить рамку',
  removeFrame: 'Убрать рамку',
  stylesLabel: 'Стиль раскладки',
  randomize: 'Случайная раскладка',
  order: 'Заказать рамки',
  orderMessage: (o: {
    frames: number;
    vertical: number;
    horizontal: number;
    frame: string;
    wall: string;
    size: string;
    style: string;
  }) =>
    [
      'Привет, хочу заказать рамки для галереи',
      `Рамок: ${o.frames} (верт. ${o.vertical}, гор. ${o.horizontal}), рамка ${o.frame} см`,
      `Стена: ${o.wall} см`,
      o.size && `Размер композиции: ${o.size} см`,
      o.style && `Стиль: ${o.style}`,
      'Фото пришлю сюда',
    ]
      .filter(Boolean)
      .join('\n'),
  rotate: 'Повернуть',
  remove: 'Убрать',
  // подсказки под панелью
  atMax: (w: number, h: number, max: number) =>
    `На стене ${w}×${h} помещается максимум ${max} ${plural(max, 'рамка', 'рамки', 'рамок')}, больше система не вместит.`,
  shrunk: (max: number) => `Стена стала меньше: теперь на ней помещается только ${max} ${plural(max, 'рамка', 'рамки', 'рамок')}.`,
  noRoom: 'Стена слишком маленькая: на ней не помещается ни одной рамки.',
  styleFailed: (style: string) => `Стилем «${style}» столько рамок на этой стене не разложить, попробуй другой.`,
  cantRotate: 'Повёрнутой рамке здесь не хватает места.',
  styleUsed: (style: string) => `Стиль: ${style}`,
  // цифры
  statDots: (nx: number, ny: number) => `шайб в сетке (${nx}×${ny})`,
  statMagnets: 'квадрат магнитов в рамке, см',
  statPlaces: 'позиций для рамки: верт. / гор.',
  statUnique: (n: number) => `найдено раскладок на ${n} ${plural(n, 'рамку', 'рамки', 'рамок')}`,
  statFrames: (dots: number) => `рамок сейчас · занято шайб ${dots}`,
  statSize: 'размер композиции, см',
  // избранное
  favTitle: 'Мои раскладки',
  favName: 'Название раскладки',
  favSave: 'Сохранить текущую',
  favDefaultName: (n: number) => `Раскладка ${n}`,
  favSaved: (name: string) => `Сохранено: «${name}»`,
  favEmpty: 'Пока пусто. Собери раскладку, дай ей название и нажми «Сохранить текущую».',
  favNote: 'Раскладки хранятся только в этом браузере.',
  favApply: 'Применить',
  favRename: 'Переименовать',
  favDelete: 'Удалить',
  favDeleteConfirm: 'Точно удалить?',
  favMeta: (n: number, w: number, h: number) => `${n} ${plural(n, 'рамка', 'рамки', 'рамок')} · стена ${w}×${h}`,
  favApplied: (name: string) => `Раскладка: «${name}»`,
};

export function plural(n: number, one: string, few: string, many: string) {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
  return many;
}
