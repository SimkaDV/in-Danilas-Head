export const catalogTitle = 'Конвеер 3D изделий';

// подсказки поверх сцены конвейера
export const catalogNotes = [
  { id: 'printer', text: 'Тут моя главная гордость — принтер и мои изделия на нём' },
  { id: 'catalog', text: 'И каталог, чтобы поглядеть поближе, а при желании заказать у меня' },
];

// фото принтера в подсказке открывается крупно
export const catalogPhotoAlt = 'Мой принтер на рабочем месте';
export const catalogPhotoZoomLabel = 'Открыть фото принтера крупно';
export const catalogPhotoCloseLabel = 'Закрыть фото';

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
export const modelAboutTitle = 'Об айтеме';
export const modelSpecsTitle = 'Характеристики';
export const modelPhotoPickLabel = 'Показать фото';
export const modelMoreTitle = 'Ещё из каталога';
export const modelImageKinds = { render: 'Рендер', photo: 'Фото' } as const;
