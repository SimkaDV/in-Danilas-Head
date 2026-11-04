import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { z } from 'astro/zod';

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

export const collections = { interests };
