/**
 * Проверка заявки из формы бронирования на сервере.
 *
 * Присланные из браузера данные не имеют силы: сумму пересчитываем сами по
 * тарифу и количеству ночей, категории сверяем со справочником (lib/booking.ts),
 * поля обрезаем и вычищаем управляющие символы. Иначе в склад попали бы либо
 * «ноль рублей за люкс», либо произвольный текст в поле «тариф».
 *
 * Отдельный модуль нужен, чтобы route handler оставался про HTTP, а правила
 * проверки можно было переиспользовать (например, в тестах или при импорте
 * заявок из CRM).
 */

import {
  MAX_EXTRA_GUESTS,
  MAX_NIGHTS,
  calcTotal,
  findRate,
  findRoomType,
  normalizePhoneDigits,
  phoneToE164,
  pricePerNight,
  roomTypeLabel,
} from '@/lib/booking';
import type { StoredLead } from '@/lib/server/leads-store';

/** Откуда могли открыть форму: сверяем со списком, остальное помечаем «сайт» */
const KNOWN_SOURCES = ['hero', 'header', 'prices', 'contacts', 'site', 'admin'];

const LIMITS = {
  name: 80,
  surname: 80,
  comment: 500,
  phone: 30,
};

/**
 * Одна строка вместо нескольких replace: \p{C} — управляющие и невидимые символы
 * (perlr|newline|tab), которые ломают вывод в таблице и экспорт в CSV.
 */
function cleanText(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/\p{C}/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}/.test(value)) return false;
  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return false;
  // Заявка из 1970 или из 3000 — мусор, а не дата заезда
  const year = new Date(parsed).getUTCFullYear();
  return year >= 2000 && year <= 2100;
}

export type LeadParseResult = { ok: true; lead: StoredLead } | { ok: false; message: string };

export function parseLeadPayload(raw: unknown): LeadParseResult {
  if (!raw || typeof raw !== 'object') {
    return { ok: false, message: 'Тело заявки должно быть JSON-объектом' };
  }
  const body = raw as Record<string, unknown>;

  const name = cleanText(body.name, LIMITS.name);
  const surname = cleanText(body.surname, LIMITS.surname);
  if (!name || !surname) return { ok: false, message: 'Нужны имя и фамилия' };

  const digits = normalizePhoneDigits(String(body.phone ?? ''));
  if (digits.length !== 10) return { ok: false, message: 'Нужен полный номер телефона' };

  if (body.consent !== true) return { ok: false, message: 'Без согласия на обработку данных заявку принять нельзя' };

  if (!isIsoDate(body.checkIn)) return { ok: false, message: 'Не понятна дата заезда' };
  const checkIn = String(body.checkIn).slice(0, 10);

  const nights = Number(body.nights);
  if (!Number.isInteger(nights) || nights < 1 || nights > MAX_NIGHTS) {
    return { ok: false, message: `Количество ночей — от 1 до ${MAX_NIGHTS}` };
  }

  const rate = findRate(String(body.rateId ?? ''));
  const room = findRoomType(String(body.roomTypeId ?? ''));
  if (!RATES_INCLUDE(rate.id) || !ROOMS_INCLUDE(room.id)) {
    return { ok: false, message: 'Неизвестный тариф или категория номера' };
  }

  const wantsExtra = body.hasExtraGuest === 'yes';
  const extraRequested = Number(body.extraGuests);
  const extraGuests = wantsExtra
    ? Math.min(Math.max(Number.isFinite(extraRequested) ? Math.trunc(extraRequested) : 1, 1), MAX_EXTRA_GUESTS)
    : 0;

  const source = KNOWN_SOURCES.includes(String(body.source)) ? String(body.source) : 'site';

  // Сумму считаем сами: клиентская могла быть пересчитана в консоли
  const perNight = pricePerNight(rate, extraGuests);

  return {
    ok: true,
    lead: {
      leadId: '',
      status: 'new',
      submittedAt: new Date().toISOString(),

      name,
      surname,
      phone: cleanText(body.phone, LIMITS.phone),
      phoneE164: phoneToE164(digits),

      rateId: rate.id,
      ratePeriod: rate.period,
      roomTypeId: room.id,
      roomTypeLabel: roomTypeLabel(room),

      hasExtraGuest: wantsExtra ? 'yes' : 'no',
      extraGuests,
      extraGuestsPrice: perNight - rate.price,

      checkIn,
      nights,
      pricePerNight: perNight,
      total: calcTotal(rate, nights, extraGuests),

      comment: cleanText(body.comment, LIMITS.comment),
      source,
      consent: true,
    },
  };
}

/** Справочники lib/booking возвращают дефолт на неизвестный id — проверяем попадание */
function RATES_INCLUDE(id: string): boolean {
  return findRate(id).id === id;
}

function ROOMS_INCLUDE(id: string): boolean {
  return findRoomType(id).id === id;
}
