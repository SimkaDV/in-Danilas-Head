"""Выгрузка музыки с Яндекс Музыки в таблицу с предложенным стилем для плеера.

Забирает лайкнутые треки и треки из всех своих плейлистов, по жанру альбома
предлагает стиль (techno / lofi / jazz / разобрать вручную) и сохраняет
out/tracks.csv (открывается в Excel и Google Таблицах) и out/tracks.json.

Токен берётся из .env рядом со скриптом (YANDEX_MUSIC_TOKEN=...) или из
переменной окружения. Запуск: .venv/bin/python export.py
"""

import csv
import json
import os
import sys
from collections import Counter
from pathlib import Path

from yandex_music import Client

HERE = Path(__file__).resolve().parent
OUT = HERE / 'out'
BATCH = 200  # столько треков за один запрос к Яндексу

# жанр альбома на Яндексе -> стиль плеера; чего нет в списке, уходит в «manual»
GENRE_STYLE = {
    'techno': 'techno', 'house': 'techno', 'electronics': 'techno', 'dance': 'techno',
    'trance': 'techno', 'dnb': 'techno', 'dubstep': 'techno', 'industrial': 'techno',
    'edmgenre': 'techno', 'experimental': 'techno', 'breakbeat': 'techno',
    'ambient': 'lofi', 'lounge': 'lofi', 'newage': 'lofi', 'relax': 'lofi',
    'meditation': 'lofi', 'chill': 'lofi', 'lofi': 'lofi', 'triphopgenre': 'lofi', 'downtempo': 'lofi',
    'jazz': 'jazz', 'smoothjazz': 'jazz', 'vocaljazz': 'jazz', 'conjazz': 'jazz',
    'bebopgenre': 'jazz', 'tradjazz': 'jazz', 'soul': 'jazz', 'blues': 'jazz', 'funk': 'jazz',
}
# слова в названии трека или альбома, которые важнее жанра альбома
KEYWORD_STYLE = {'lofi': 'lofi', 'lo-fi': 'lofi', 'lo fi': 'lofi', 'chillhop': 'lofi', 'jazz': 'jazz', 'techno': 'techno'}

FIELDS = ['style', 'artist', 'title', 'album', 'year', 'genre', 'duration', 'liked', 'playlists', 'available', 'url']


def load_token():
    env = HERE / '.env'
    if env.exists():
        for line in env.read_text(encoding='utf-8').splitlines():
            key, _, value = line.partition('=')
            if key.strip() == 'YANDEX_MUSIC_TOKEN' and value.strip():
                return value.strip().strip('"\'')
    token = os.environ.get('YANDEX_MUSIC_TOKEN')
    if not token:
        sys.exit('Нет токена: положи YANDEX_MUSIC_TOKEN=... в tools/yandex-music/.env (см. README.md)')
    return token


def suggest_style(genre, title, album):
    text = f'{title} {album}'.lower()
    for word, style in KEYWORD_STYLE.items():
        if word in text:
            return style
    return GENRE_STYLE.get(genre or '', 'manual')


def fetch_tracks(client, ids):
    tracks = []
    for start in range(0, len(ids), BATCH):
        tracks += client.tracks(ids[start:start + BATCH])
        print(f'  треки: {min(start + BATCH, len(ids))} из {len(ids)}')
    return tracks


def main():
    client = Client(load_token()).init()
    print(f'Вошёл как {client.me.account.login}')

    # id трека -> «id:альбом» для запроса и в каких плейлистах он лежит
    keys, in_playlists, liked = {}, {}, set()

    likes = client.users_likes_tracks()
    for short in likes.tracks if likes else []:
        keys[str(short.id)] = short.track_id
        liked.add(str(short.id))
    print(f'Лайков: {len(liked)}')

    for playlist in client.users_playlists_list():
        full = client.users_playlists(playlist.kind)
        shorts = full.tracks or full.fetch_tracks()
        print(f'Плейлист «{playlist.title}»: {len(shorts)}')
        for short in shorts:
            keys.setdefault(str(short.id), short.track_id)
            in_playlists.setdefault(str(short.id), []).append(playlist.title)

    rows = []
    for track in fetch_tracks(client, list(keys.values())):
        track_id = str(track.id)
        album = track.albums[0] if track.albums else None
        title = f'{track.title} ({track.version})' if track.version else track.title
        genre = album.genre if album else None
        seconds = (track.duration_ms or 0) // 1000
        rows.append({
            'style': suggest_style(genre, title, album.title if album else ''),
            'artist': ', '.join(a.name for a in track.artists or []),
            'title': title,
            'album': album.title if album else '',
            'year': album.year if album and album.year else '',
            'genre': genre or '',
            'duration': f'{seconds // 60}:{seconds % 60:02d}',
            'liked': 'да' if track_id in liked else '',
            'playlists': ' | '.join(in_playlists.get(track_id, [])),
            'available': 'да' if track.available else 'нет',
            'url': f'https://music.yandex.ru/album/{album.id}/track/{track_id}' if album else '',
        })

    rows.sort(key=lambda row: (row['style'], row['genre'], row['artist'].lower()))
    OUT.mkdir(exist_ok=True)
    with open(OUT / 'tracks.csv', 'w', newline='', encoding='utf-8-sig') as file:
        writer = csv.DictWriter(file, fieldnames=FIELDS)
        writer.writeheader()
        writer.writerows(rows)
    (OUT / 'tracks.json').write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding='utf-8')

    print(f'\nВсего треков: {len(rows)} -> {OUT / "tracks.csv"}')
    for style, count in Counter(row['style'] for row in rows).most_common():
        print(f'  {style}: {count}')
    manual = Counter(row['genre'] or '(без жанра)' for row in rows if row['style'] == 'manual')
    if manual:
        print('\nЖанры в «manual» (можно дописать в GENRE_STYLE):')
        for genre, count in manual.most_common(15):
            print(f'  {genre}: {count}')


if __name__ == '__main__':
    main()
