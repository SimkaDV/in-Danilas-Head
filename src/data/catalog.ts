export const catalogTitle = 'Конвеер 3D изделий';

// подсказки поверх сцены конвейера
export const catalogNotes = [
  { id: 'printer', text: 'Тут моя главная гордость — принтер и мои изделия на нём' },
  { id: 'catalog', text: 'И каталог, чтобы поглядеть поближе, а при желании заказать у меня' },
];

export const catalogFiltersLabel = 'Категории моделей';

export const catalogFilters = [
  { id: 'all', label: 'Все' },
  { id: 'home', label: 'Дом' },
  { id: 'storage', label: 'Хранение' },
];

// сами модели лежат в src/content/models, см. коллекцию models в content.config.ts
export const catalogCtaLabel = 'Хочу такую';

// страница модели
export const modelBackLabel = 'Назад в каталог';
export const modelSpecsTitle = 'Характеристики';
export const modelImageKinds = { render: 'Рендер', photo: 'Фото' } as const;
