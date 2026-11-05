// плеер в полосе сверху: стили музыки, у каждого свой носитель и плейлист на SoundCloud
export type PlayerMedium = 'cd' | 'cassette' | 'vinyl';

export interface PlayerStyle {
  id: string;
  label: string;
  medium: PlayerMedium;
  playlistUrl: string;
}

// плейлисты должны быть открытыми, закрытый – только по номеру с секретным ключом (см. jazzPrivate)
const playlist = (slug: string) => `https://soundcloud.com/danila-simonov-381433862/sets/${slug}`;

// «Фон джаз / интструментал» пока закрытый: плеер SoundCloud берёт такой плейлист только по номеру
// с секретным ключом (из кода встраивания), обычная ссылка с /s-… не работает. Станет открытым –
// можно вернуть playlist('fon-dzhaz-intstrumental')
const jazzPrivate = 'https://api.soundcloud.com/playlists/2325124701?secret_token=s-cvYLtlHIbuI';

export const playerStyles: PlayerStyle[] = [
  { id: 'techno', label: 'Techno', medium: 'cd', playlistUrl: playlist('fon-elektro') },
  { id: 'lofi', label: 'LoFi', medium: 'cassette', playlistUrl: playlist('idealnyj-fon') },
  { id: 'jazz', label: 'Jazz', medium: 'vinyl', playlistUrl: jazzPrivate },
];

export const playerText = {
  label: 'Музыкальный плеер',
  modesLabel: 'Стиль музыки',
  pause: 'Pause',
  nowPlaying: "What's playing?",
  show: 'Show',
  popupTitle: 'Сейчас играет',
  idle: 'Пока тишина. Выбери стиль слева, и заиграет музыка.',
  loading: 'Загружаю трек…',
  error: 'Не получилось загрузить SoundCloud. Попробуй ещё раз чуть позже.',
  listen: 'Слушать на SoundCloud',
  close: 'Закрыть',
};
