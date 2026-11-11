import type { ImageMetadata } from 'astro';
import gallery from '@/assets/interests/gallery.png';
import museum from '@/assets/interests/museum.jpg';
import { telegramLink } from '@/data/contacts';

// шапка страницы «Цифровая галерея»: заголовок, обложка с рамкой, фишки и кнопки
export const galleryHero = {
  title: 'Цифровая галерея',
  frameLabel: 'Рамка с фотографиями из галереи',
  interval: 4000, // мс между фото в рамке
  build: 'Собрать свою стену',
  order: { label: 'Заказать рамки', href: telegramLink('Привет, хочу заказать рамки для галереи') },
};

// фишки под обложкой, как «приколы» кейса на главной
export const galleryHeroFeatures = [
  {
    title: 'Снимаю на мыльницу',
    text: 'Фотки из скитаний и поездок: люди, места, странные штуки. Здесь лежат подборки этих кадров.',
    shape: 'a',
    icon: 'camera',
  },
  {
    title: 'Галерея в реальной жизни',
    text: 'Система магнитных рамок переносит фото со страницы на стену. Рамки будут разные – можно выбрать свою.',
    shape: 'b',
    icon: 'frame',
  },
  {
    title: 'Рамка садится как угодно',
    text: 'Шайбы на стене с шагом 12 см, магниты в рамке стоят квадратом: рамка висит и вертикально, и горизонтально и переставляется за секунду.',
    shape: 'c',
    icon: 'magnet',
  },
] as const;

// фото, которые по очереди показываются в рамке; collection – куда ведёт подпись под рамкой.
// Пока временные картинки с сайта, потом – фото из коллекций.
export const galleryHeroPhotos: { src: ImageMetadata; alt: string; collection?: { name: string; href: string } }[] = [
  { src: museum, alt: 'Веер и капитель на серой стене' },
  { src: gallery, alt: 'Глиняные горшки на заборе в сосновом лесу' },
];
