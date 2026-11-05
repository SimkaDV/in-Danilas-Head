// библиотека пластиков: общая для всех моделей, в model.json модели список id в поле colors.
// color: цвет квадратика, пока вместо фото или скана пластика
export const plastics = [
  { id: 'brown', name: 'Коричневый', color: '#7B4B2E', description: 'Тёплый коричневый, матовый PLA. Подробное описание и фото пластика появятся позже.' },
  { id: 'beige', name: 'Бежевый', color: '#C9B99A', description: 'Светлый бежевый, матовый PLA. Подробное описание и фото пластика появятся позже.' },
  { id: 'chocolate', name: 'Шоколадный', color: '#4A2F2A', description: 'Тёмный шоколадный, матовый PLA. Подробное описание и фото пластика появятся позже.' },
  { id: 'sand', name: 'Песочный', color: '#BFA88A', description: 'Песочный, матовый PLA. Подробное описание и фото пластика появятся позже.' },
  { id: 'yellow', name: 'Жёлтый', color: '#E8C84A', description: 'Яркий жёлтый PLA. Подробное описание и фото пластика появятся позже.' },
  { id: 'white', name: 'Белый', color: '#E8E8E8', description: 'Чистый белый PLA. Подробное описание и фото пластика появятся позже.' },
] as const;

export type PlasticId = (typeof plastics)[number]['id'];
