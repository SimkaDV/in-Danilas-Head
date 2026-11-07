import { heroLinks } from './hero';
import { telegramChannel } from './contacts';

export const footerTitle = 'В голове у Даньки';

// ссылки соцсетей проекта, Instagram пока заглушка
export const footerSocials = [
  { id: 'telegram', label: 'Telegram', href: telegramChannel },
  { id: 'instagram', label: 'Instagram', href: '#' },
] as const;

// якоря главной с / впереди, чтобы работали и со страницы модели
export const footerNav = {
  title: 'Навигация',
  links: [{ label: 'Главная', href: '/' }, ...heroLinks.map((link) => ({ ...link, href: `/${link.href}` }))],
};

// сами интересы берутся из interests.json, ссылкой становятся те, у кого есть href
export const footerInterestsTitle = 'Интересы';

// страниц пока нет, ведут на #
export const footerProject = {
  title: 'Проект',
  links: [
    { label: 'Команда', href: '#' },
    { label: 'Политика конфиденциальности', href: '#' },
  ],
};

export const footerCopyright = '© 2026 В голове у Даньки';
