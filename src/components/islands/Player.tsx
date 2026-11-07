import { useEffect, useRef, useState } from 'react';
import type { PlayerStyle } from '@/data/player';
import { createWidget, largeArtwork, widgetOptions, type SoundCloudWidget } from '@/scripts/soundcloud';
import './Player.css';

type Status = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

interface Track {
  title: string;
  author: string;
  artwork: string | null;
  url: string;
}

interface Props {
  styles: PlayerStyle[];
  text: Record<
    | 'label'
    | 'modesLabel'
    | 'pause'
    | 'prev'
    | 'next'
    | 'nowPlaying'
    | 'show'
    | 'popupTitle'
    | 'idle'
    | 'loading'
    | 'error'
    | 'listen'
    | 'close',
    string
  >;
}

const PAUSE = 'pause';
// столько ждём, пока плейлист начнёт играть; дольше – значит, он закрыт или удалён
const LOAD_TIMEOUT = 12000;
// «назад» после стольких мс трека отматывает его в начало, раньше – переключает на предыдущий
const RESTART_AFTER = 3000;

// липкая полоса сверху: слева кнопки стилей, по центру крутится носитель, справа «что играет» с поп-апом
export default function Player({ styles, text }: Props) {
  const [mode, setMode] = useState(PAUSE);
  const [medium, setMedium] = useState<PlayerStyle['medium'] | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [track, setTrack] = useState<Track | null>(null);
  const [popOpen, setPopOpen] = useState(false);

  const host = useRef<HTMLDivElement>(null);
  const widget = useRef<Promise<SoundCloudWidget> | null>(null);
  const loadedUrl = useRef<string | null>(null);
  const wantPlay = useRef(false);
  const ready = useRef(false);
  const loadTimer = useRef<number | undefined>(undefined);
  const canHover = useRef(false);

  useEffect(() => {
    canHover.current = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && setPopOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // виджет создаётся один раз, по первому нажатию на стиль
  const getWidget = (url: string) => {
    widget.current ??= createWidget(host.current!, url).then(({ widget: w, events }) => {
      ready.current = true;
      loadedUrl.current = url;
      const refreshTrack = () =>
        w.getCurrentSound((sound) => {
          if (!sound) return;
          setTrack({
            title: sound.title,
            author: sound.user?.username ?? '',
            artwork: largeArtwork(sound.artwork_url ?? sound.user?.avatar_url),
            url: sound.permalink_url,
          });
        });

      w.bind(events.PLAY, () => {
        // кнопку паузы могли нажать, пока трек грузился
        if (!wantPlay.current) return w.pause();
        window.clearTimeout(loadTimer.current);
        setStatus('playing');
        refreshTrack();
      });
      w.bind(events.PAUSE, () => setStatus((current) => (current === 'playing' ? 'paused' : current)));
      w.bind(events.ERROR, () => setStatus('error'));
      // плейлист закончился: начинаем сначала
      w.bind(events.FINISH, () =>
        w.getSounds((sounds) =>
          w.getCurrentSoundIndex((index) => {
            if (index >= sounds.length - 1) w.skip(0);
          }),
        ),
      );
      return w;
    });
    return widget.current;
  };

  // плейлист не заиграл: закрыт, удалён или SoundCloud недоступен
  const failLoad = () => {
    wantPlay.current = false;
    loadedUrl.current = null;
    // виджет так и не поднялся: в следующий раз создаём заново
    if (!ready.current) {
      widget.current = null;
      host.current?.replaceChildren();
    }
    setMode(PAUSE);
    setTrack(null);
    setStatus('error');
  };

  const pickStyle = async (style: PlayerStyle) => {
    if (style.id === mode) return;
    setMode(style.id);
    setMedium(style.medium);
    wantPlay.current = true;
    if (status !== 'playing' && status !== 'paused') setStatus('loading');
    window.clearTimeout(loadTimer.current);
    loadTimer.current = window.setTimeout(failLoad, LOAD_TIMEOUT);

    try {
      const w = await getWidget(style.playlistUrl);
      if (!wantPlay.current) return;
      if (loadedUrl.current === style.playlistUrl) {
        w.play();
      } else {
        // другой плейлист: грузим его и сразу играем
        loadedUrl.current = style.playlistUrl;
        setTrack(null);
        setStatus('loading');
        w.load(style.playlistUrl, widgetOptions);
      }
    } catch {
      window.clearTimeout(loadTimer.current);
      failLoad();
    }
  };

  const pause = async () => {
    if (mode === PAUSE) return;
    setMode(PAUSE);
    wantPlay.current = false;
    window.clearTimeout(loadTimer.current);
    if (widget.current) (await widget.current).pause();
    setStatus((current) => (current === 'loading' ? 'idle' : current === 'playing' ? 'paused' : current));
  };

  // стрелки: «вперёд» после последнего трека начинает плейлист сначала,
  // «назад» сначала отматывает текущий трек в начало, повторное нажатие – предыдущий трек
  const skipTrack = async (direction: 'prev' | 'next') => {
    if (!widget.current) return;
    const w = await widget.current;
    w.getSounds((sounds) =>
      w.getCurrentSoundIndex((index) => {
        if (direction === 'next') return index >= sounds.length - 1 ? w.skip(0) : w.next();
        w.getPosition((position) => (position > RESTART_AFTER || index <= 0 ? w.seekTo(0) : w.prev()));
      }),
    );
  };

  const hoverPop = (open: boolean) => canHover.current && setPopOpen(open);

  const message = status === 'error' ? text.error : status === 'loading' && !track ? text.loading : text.idle;
  const spinning = mode !== PAUSE && status === 'playing';
  // стрелки видны, пока выбран стиль и трек уже заиграл; на паузе и при смене плейлиста прячутся
  const canSkip = mode !== PAUSE && track !== null && status !== 'error';

  return (
    <div className="player" role="region" aria-label={text.label} data-skip={canSkip || undefined}>
      <div className="player__modes" role="group" aria-label={text.modesLabel}>
        <button type="button" className="player__mode" aria-pressed={mode === PAUSE} onClick={pause}>
          <span className="player__socket" aria-hidden="true">
            <span className="player__dot" />
          </span>
          {text.pause}
        </button>
        {styles.map((style) => (
          <button
            key={style.id}
            type="button"
            className="player__mode"
            aria-pressed={mode === style.id}
            onClick={() => pickStyle(style)}
          >
            <span className="player__socket" aria-hidden="true">
              <span className="player__dot" />
            </span>
            {style.label}
          </button>
        ))}
      </div>

      <div className="player__deck" data-skip={canSkip || undefined}>
        <button type="button" className="player__skip player__skip--prev" aria-label={text.prev} onClick={() => skipTrack('prev')}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M6 5v14M19 5l-10 7 10 7z" />
          </svg>
        </button>
        <span
          className="player__disc"
          aria-hidden="true"
          data-medium={medium ?? 'none'}
          data-spinning={spinning || undefined}
          data-loading={(mode !== PAUSE && status === 'loading') || undefined}
        />
        <button type="button" className="player__skip player__skip--next" aria-label={text.next} onClick={() => skipTrack('next')}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M18 5v14M5 5l10 7-10 7z" />
          </svg>
        </button>
      </div>

      {/* с мышью поп-ап открыт, пока курсор или фокус внутри блока, на таче открывается тапом */}
      <div
        className="player__now"
        onMouseEnter={() => hoverPop(true)}
        onMouseLeave={() => hoverPop(false)}
        onFocus={() => hoverPop(true)}
        onBlur={(event) => !event.currentTarget.contains(event.relatedTarget) && hoverPop(false)}
      >
        <span className="player__now-label">{text.nowPlaying}</span>
        <button
          type="button"
          className="player__show"
          aria-expanded={popOpen}
          aria-controls="player-pop"
          onClick={() => setPopOpen((open) => (canHover.current ? true : !open))}
        >
          <span className="player__show-label">{text.show}</span>
          {/* на телефоне, пока играет музыка, кнопка сжимается в кружок с лупой и освобождает место стрелкам */}
          <svg className="player__show-icon" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="10.5" cy="10.5" r="6" />
            <path d="M15 15l5 5" />
          </svg>
        </button>

        <div
          className="player__pop"
          id="player-pop"
          hidden={!popOpen}
          onClick={(event) => event.target === event.currentTarget && setPopOpen(false)}
        >
          <div className="player__pop-body" role="status">
            <span className="player__pop-title">{text.popupTitle}</span>
            {track ? (
              <>
                <span className="player__pop-cover">
                  {track.artwork ? <img src={track.artwork} alt="" width="300" height="300" /> : <span className="player__pop-note" />}
                </span>
                <span className="player__pop-track">{track.title}</span>
                {track.author && <span className="player__pop-author">{track.author}</span>}
                <a className="player__pop-link" href={track.url} target="_blank" rel="noopener noreferrer">
                  {text.listen}
                </a>
              </>
            ) : (
              <p className="player__pop-text">{message}</p>
            )}
            {track && status === 'error' && <p className="player__pop-text">{text.error}</p>}
            <button type="button" className="player__pop-close" aria-label={text.close} onClick={() => setPopOpen(false)}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="player__engine" ref={host} />
    </div>
  );
}
