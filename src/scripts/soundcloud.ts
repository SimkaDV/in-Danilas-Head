// обёртка над SoundCloud Widget API: скрытый iframe-плеер, которым управляем со страницы.
// скрипт и iframe грузятся только по первому запросу, без него сайт не тянет чужой код и куки
const API_SRC = 'https://w.soundcloud.com/player/api.js';
const PLAYER_SRC = 'https://w.soundcloud.com/player/';

export interface SoundCloudSound {
  title: string;
  permalink_url: string;
  artwork_url: string | null;
  user?: { username: string; avatar_url?: string };
}

export interface SoundCloudWidget {
  bind(event: string, listener: (...args: unknown[]) => void): void;
  load(url: string, options: Record<string, unknown>): void;
  play(): void;
  pause(): void;
  skip(index: number): void;
  next(): void;
  prev(): void;
  seekTo(milliseconds: number): void;
  getPosition(callback: (milliseconds: number) => void): void;
  getCurrentSound(callback: (sound: SoundCloudSound | null) => void): void;
  getCurrentSoundIndex(callback: (index: number) => void): void;
  getSounds(callback: (sounds: SoundCloudSound[]) => void): void;
}

interface SoundCloudApi {
  Widget: ((iframe: HTMLIFrameElement) => SoundCloudWidget) & {
    Events: Record<'READY' | 'PLAY' | 'PAUSE' | 'FINISH' | 'ERROR', string>;
  };
}

declare global {
  interface Window {
    SC?: SoundCloudApi;
  }
}

let apiPromise: Promise<SoundCloudApi> | undefined;

const loadApi = () => {
  apiPromise ??= new Promise((resolve, reject) => {
    if (window.SC) return resolve(window.SC);
    const script = document.createElement('script');
    script.src = API_SRC;
    script.async = true;
    script.onload = () => (window.SC ? resolve(window.SC) : reject(new Error('SC API missing')));
    script.onerror = () => {
      apiPromise = undefined;
      reject(new Error('SC API failed to load'));
    };
    document.head.append(script);
  });
  return apiPromise;
};

export const widgetOptions = {
  auto_play: true,
  visual: false,
  show_artwork: false,
  show_comments: false,
  show_user: false,
  show_teaser: false,
  sharing: false,
  buying: false,
  download: false,
};

// создаёт скрытый iframe с первым плейлистом и ждёт, пока виджет будет готов
export async function createWidget(host: HTMLElement, url: string) {
  const SC = await loadApi();
  const iframe = document.createElement('iframe');
  const params = new URLSearchParams({ url, ...Object.fromEntries(Object.entries(widgetOptions).map(([k, v]) => [k, String(v)])) });
  iframe.src = `${PLAYER_SRC}?${params}`;
  iframe.allow = 'autoplay; encrypted-media';
  iframe.title = 'SoundCloud';
  iframe.tabIndex = -1;
  iframe.setAttribute('aria-hidden', 'true');
  host.append(iframe);

  const widget = SC.Widget(iframe);
  await new Promise<void>((resolve) => widget.bind(SC.Widget.Events.READY, () => resolve()));
  return { widget, events: SC.Widget.Events };
}

// обложка покрупнее: SoundCloud по умолчанию отдаёт 100×100
export const largeArtwork = (url: string | null | undefined) => url?.replace('-large.', '-t300x300.') ?? null;
