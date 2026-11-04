# NOTES — В голове у Даньки
Стек: Astro + React (React только для интерактивных «островов»).
Шрифт: только Rubik (@fontsource-variable/rubik).
Палитра: bg #8EAE69, deep #4A6938, dark #292D25, accent #D4FB0B.

## Структура
- src/pages — страницы (пока одна главная `index.astro`)
- src/layouts — `Layout.astro`: `<html>`, мета, фон-сетка, футер
- src/components/ui — мелкие кирпичики (`Button`, `ScrollArrow`, `FeatureCard`)
- src/components/layout — каркас (`Container`, `Section`, `Footer`); шапки (Header) пока нет
- src/components/sections — блоки страниц (`Hero`, `Flagship`)
- src/components/islands — React-острова (`CaseTabs`)
- src/data — тексты и данные без разметки (`hero.ts`, `flagship.ts`)
- src/assets — картинки, которые обрабатывает Astro (`head.webp`, `flagship-case.png`, `bg-grid.png`)
- src/styles — tokens.css (все переменные) и global.css
- docs — заметки и статус по roadmap (сам roadmap живёт в чате claude.ai, в репо его копии нет)

## Правила
1. Цвета, размеры, шрифты только через переменные из tokens.css.
2. Страница собирает секции, секция собирается из ui-компонентов.
3. React только для интерактива, подключать через client:load / client:visible.
4. Импорты через алиас @/.
5. Каждый заход заканчивается рабочим состоянием, которое можно задеплоить.

## Hero
- Секция собрана в `src/components/sections/Hero.astro` из `Button` и `ScrollArrow` в `src/components/ui/`.
- Тексты и ссылки хранятся отдельно в `src/data/hero.ts`.
- В `src/styles/tokens.css` добавлены временные токены панели, кнопок, заголовка и радиусов.
- Голова — одна картинка `src/assets/head.webp` (1041px, прозрачный фон), Astro отдаёт её в 1x/2x/3x.
- Голова целиком размещается внутри панели.
- Левая колонка сцены пока пустая под будущую строку «что это за место».

## Flagship (коллекция кейсов)
- Секция `src/components/sections/Flagship.astro`, якорь `#collection`.
- Тексты, варианты кейса, фишки и кнопка в `src/data/flagship.ts`.
- Кирпичики: `Button` (проп `arrow`), `FeatureCard` (проп `shape` a/b/c задаёт «вырезанный» угол).
- Табы вариантов — React-остров `src/components/islands/CaseTabs.tsx` (`client:visible`): показывает элемент с `data-case-variant` активного варианта.
- Рендер кейса `src/assets/flagship-case.png`, пока один на все варианты.
- Цвета подогнаны под палитру: клякса и активный таб `--color-accent`, карточки `--color-deep`.
- Кнопка пока ведёт на `#`, цены нет.

## Главная сейчас
Порядок на `src/pages/index.astro`: Hero → Flagship (`#collection`) → заглушка «Вторая секция» (`#about`) → заглушка «Каталог моделей» (`#catalog`) → футер.

## Статус по roadmap (на 2026-11-04)
Полного roadmap в репо нет, пункты ниже собраны из того, что упоминалось в работе.

**Сделано и лежит в `main`:**
- Чистая основа Astro + React, алиас `@/`, токены, Rubik.
- Фон-сетка на всех страницах.
- Hero: заголовок, голова (одна картинка), три кнопки-якоря, стрелка вниз.
- Flagship (коллекция кейсов): рендер, табы вариантов, кнопка, три карточки фишек.

**Сделано, но не влито в `main`:**
- Ветка `claude/interests-grid-about-page-790009` — секция About (бенто-сетка интересов, коллекция `interests`), заменяет заглушку `#about`.
- Ветка `claude/website-review-continue-e5d214` — ru/en через словари `src/i18n`, шкала отступов `--space-*`, `npm run check`, `CLAUDE.md`, Rubik в зависимостях. Ветка старше Flagship и новой головы в Hero, при слиянии будут конфликты, а Flagship придётся перевести на словари.

**Дальше по roadmap:**
- Деплой на Vercel.
- Шапка (Header).
- Каталог моделей (`#catalog`, сейчас заглушка).
- «Продающая история» кейса: цена или «от …», куда ведёт кнопка «Собрать кейс» (сейчас `#`).
- После MVP: конструктор кейса.

**Хвосты:**
- `@fontsource-variable/rubik` импортируется в `Layout.astro`, но в `main` его нет в `package.json` (фикс есть в ветке website-review). Чистая установка, в том числе на Vercel, упадёт.
- Рендеры пенала и таблетницы: пока одна картинка на все табы.
- Строка «что это за место» в левой колонке Hero.
- Токены `/* hero, временно */` в tokens.css так и не разобраны; в компонентах ещё есть сырые `px`.
- Шрифт в макете Figma не Rubik, итог на сайте может отличаться от макета.
- Опечатки и тексты карточек Flagship («Реально почти всё меняй и балдей») не переписаны.
- Имя пакета `puffy-pegasi` в package.json осталось от шаблона.
