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
    'label' | 'modesLabel' | 'pause' | 'nowPlaying' | 'show' | 'popupTitle' | 'idle' | 'loading' | 'error' | 'listen' | 'close',
    string
  >;
}

const PAUSE = 'pause';

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

  const pickStyle = async (style: PlayerStyle) => {
    if (style.id === mode) return;
    setMode(style.id);
    setMedium(style.medium);
    wantPlay.current = true;
    if (status !== 'playing' && status !== 'paused') setStatus('loading');

    try {
      const w = await getWidget(style.playlistUrl);
      if (!wantPlay.current) return;
      if (loadedUrl.current === style.playlistUrl) {
        w.play();
      } else {
        // другой плейлист: грузим его и сразу играем
        loadedUrl.current = style.playlistUrl;
        setStatus('loading');
        w.load(style.playlistUrl, widgetOptions);
      }
    } catch {
      widget.current = null;
      wantPlay.current = false;
      setMode(PAUSE);
      setStatus('error');
    }
  };

  const pause = async () => {
    if (mode === PAUSE) return;
    setMode(PAUSE);
    wantPlay.current = false;
    if (widget.current) (await widget.current).pause();
    setStatus((current) => (current === 'loading' ? 'idle' : current === 'playing' ? 'paused' : current));
  };

  const hoverPop = (open: boolean) => canHover.current && setPopOpen(open);

  const message = status === 'error' ? text.error : status === 'loading' && !track ? text.loading : text.idle;
  const spinning = mode !== PAUSE && status === 'playing';

  return (
    <div className="player" role="region" aria-label={text.label}>
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

      <div className="player__deck" aria-hidden="true">
        <span
          className="player__disc"
          data-medium={medium ?? 'none'}
          data-spinning={spinning || undefined}
          data-loading={(mode !== PAUSE && status === 'loading') || undefined}
        />
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
          {text.show}
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
