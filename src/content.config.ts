import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { catalogFilters } from './data/catalog';

// карточки бенто-сетки «О себе», порядок в файле = порядок в сетке
const interests = defineCollection({
  loader: file('src/data/interests.json'),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      text: z.string(),
      image: image().optional(),
      imageAlt: z.string().optional(),
      // чёрная рамка вокруг картинки, как у книг
      framed: z.boolean().optional(),
      // без href карточка некликабельная
      href: z.string().optional(),
      // тип ячейки: intro — высокая на два ряда, wide — длинная, square — квадрат, tall — нижний ряд
      size: z.enum(['intro', 'wide', 'square', 'tall']),
      // цвет фона, см. --color-interest-* в tokens.css
      theme: z.enum(['olive', 'sage', 'ocean', 'sky', 'forest', 'grass']),
    }),
});

// модели каталога: по папке на модель в src/content/models/<slug>/model.json,
// имя папки (латиница через дефис) = адрес страницы /catalog/<slug>/,
// папки с _ в начале не читаются (там шаблон)
const categoryIds = catalogFilters.map((filter) => filter.id).filter((id) => id !== 'all') as [string, ...string[]];

const models = defineCollection({
  loader: glob({
    pattern: '[!_]*/model.json',
    base: './src/content/models',
    generateId: ({ entry }) => entry.split('/')[0],
  }),
  schema: ({ image }) =>
    z.object({
      // в каталоге и на сайте только approved, остальное лежит в папке и ждёт
      status: z.enum(['draft', 'approved', 'archived']),
      // меньше — раньше в сетке
      order: z.number().default(0),
      title: z.string(),
      // строка на карточке
      summary: z.string(),
      // текст страницы модели, абзацы через пустую строку
      description: z.string().optional(),
      category: z.enum(categoryIds),
      price: z.string().optional(),
      // фото лежат в папке модели, src — путь относительно model.json (./01-render.png),
      // kind: render — рендер модели, photo — живое фото; первое в списке — обложка карточки
      images: z
        .array(
          z.object({
            src: image(),
            kind: z.enum(['render', 'photo']).default('photo'),
            alt: z.string().optional(),
          }),
        )
        .default([]),
      // характеристики на странице: материал, размер, время печати…
      specs: z.array(z.object({ label: z.string(), value: z.string() })).default([]),
    }),
});

export const collections = { interests, models };
