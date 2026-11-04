# NOTES — В голове у Даньки
Стек: Astro + React (React только для интерактивных «островов»).
Шрифт: только Rubik (@fontsource-variable/rubik).
Палитра: bg #8EAE69, deep #4A6938, dark #292D25, accent #D4FB0B.

## Структура
- src/components/ui — мелкие кирпичики (Button, Pill, Card)
- src/components/layout — каркас (Container, Section, Footer, Header)
- src/components/sections — блоки страниц (Hero, About, ...)
- src/components/islands — React-компоненты (Player, Model3D)
- src/data — данные без разметки (меню, плейлисты)
- src/styles — tokens.css (все переменные) и global.css
- docs — roadmap и заметки

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
