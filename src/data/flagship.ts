import { telegramLink } from '@/data/contacts';

export const flagshipEyebrow = 'Я произвёл штуку:';
export const flagshipTitle = 'Кейс-трансформер';
export const flagshipVariantsLabel = 'Он умеет быть';

// у каждого варианта позже будет свой рендер
export const flagshipVariants = [
  { id: 'cigarette', label: 'Портсигаром' },
  { id: 'pencil', label: 'Пеналом' },
  { id: 'pills', label: 'Таблетницей' },
];

// пока ведёт в личку, позже на страницу коллекции (см. ROADMAP)
export const flagshipCta = {
  label: 'Собрать кейс',
  href: telegramLink('Привет, хочу собрать кейс-трансформер'),
};

export const flagshipFeaturesTitle = 'У него реально много приколов';

export const flagshipFeatures = [
  { title: 'Он на магнитах!!', text: 'Очень удобно отсоединять и соединять', shape: 'a' },
  { title: 'Много модулей', text: 'Пока я придумал 6', shape: 'b' },
  { title: 'Кастомизируй как хочешь', text: 'Реально почти всё меняй и балдей', shape: 'c' },
] as const;
