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
- Голова состоит из `src/assets/head-top.png` и `src/assets/head-bottom.png`.
- Обе картинки головы целиком размещаются внутри панели.
- Левая колонка сцены пока пустая под будущую строку «что это за место».
