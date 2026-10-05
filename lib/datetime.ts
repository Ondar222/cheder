/**
 * Мелочи дат для админки: API Yurta оперирует unix-секундами, antd — Dayjs,
 * человек — «05.10.2026». Собираем превращения в одном месте, чтобы в формах
 * не плодить toUnix(fromUnix(...)) и не терять секунды на округлении.
 */

import dayjs, { type Dayjs } from 'dayjs';

export const DATE_FORMAT = 'DD.MM.YYYY';

/** Dayjs/строка/Date → unix-секунды (то, что ждут /v4/booking/grid и /v2/booking) */
export function toUnix(value: Dayjs | string | Date): number {
  const parsed = dayjs(value);
  return parsed.isValid() ? Math.floor(parsed.valueOf() / 1000) : 0;
}

/** unix-секунды → Dayjs; бэкенд отдаёт и миллисекунды — различаем по порядку */
export function fromUnix(value: number): Dayjs {
  if (!Number.isFinite(value) || value <= 0) return dayjs();
  return value > 1e11 ? dayjs(value) : dayjs.unix(value);
}

export function formatDate(value: Dayjs | string | number | Date): string {
  const parsed = typeof value === 'number' ? fromUnix(value) : dayjs(value);
  return parsed.isValid() ? parsed.format(DATE_FORMAT) : '—';
}

/** «05.10 — 12.10» для диапазона заезда */
export function formatRange(checkIn: number, checkOut: number): string {
  return `${formatDate(checkIn)} — ${formatDate(checkOut)}`;
}

/** Ночей между заездом и выездом (в сутках, округление вверх) */
export function nightsBetween(checkIn: number, checkOut: number): number {
  const days = (fromUnix(checkOut).valueOf() - fromUnix(checkIn).valueOf()) / 86_400_000;
  return days > 0 ? Math.round(days) : 1;
}

/** Начало выбранного дня — иначе в query уедет «сегодня в 14:37» */
export function startOfDay(value: Dayjs): Dayjs {
  return value.startOf('day');
}
