export const catalogTitle = 'Конвейер 3D-изделий';

// подсказки поверх сцены конвейера
export const catalogNotes = [
  { id: 'printer', text: 'Тут моя главная гордость – принтер и мои изделия на нём' },
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

// сообщение в личку со страницы модели, позже сюда добавятся выбранные параметры
export const modelOrderMessage = (title: string) => `Привет, хочу такую модель: ${title}`;

// страница модели
export const modelBackLabel = 'Назад в каталог';
export const modelSpecsTitle = 'Характеристики';
export const modelImageKinds = { render: 'Рендер', photo: 'Фото' } as const;
