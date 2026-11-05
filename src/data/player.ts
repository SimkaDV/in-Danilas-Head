// плеер в полосе сверху: стили музыки, у каждого свой носитель и плейлист на SoundCloud
export type PlayerMedium = 'cd' | 'cassette' | 'vinyl';

export interface PlayerStyle {
  id: string;
  label: string;
  medium: PlayerMedium;
  playlistUrl: string;
}

// пока один плейлист на все стили, позже у каждого будет свой
const testPlaylist = 'https://soundcloud.com/danila-simonov-381433862/sets/muzyka-dlya-voli-k-zhizni';

export const playerStyles: PlayerStyle[] = [
  { id: 'techno', label: 'Techno', medium: 'cd', playlistUrl: testPlaylist },
  { id: 'lofi', label: 'LoFi', medium: 'cassette', playlistUrl: testPlaylist },
  { id: 'jazz', label: 'Jazz', medium: 'vinyl', playlistUrl: testPlaylist },
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
