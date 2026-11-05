// ник публичный, он всё равно виден в ссылке на кнопке
export const telegramUsername = 'danilaS_dev';

// ссылка в личку с уже набранным сообщением
export function telegramLink(text: string) {
  return `https://t.me/${telegramUsername}?text=${encodeURIComponent(text)}`;
}
