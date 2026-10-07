/**
 * Проверка заявки из формы бронирования на сервере.
 *
 * Присланные из браузера данные не имеют силы: сумму пересчитываем сами по
 * тарифу и количеству ночей, категории сверяем со справочником (lib/booking.ts),
 * поля обрезаем и вычищаем управляющие символы. Иначе в склад попали бы либо
 * «ноль рублей за люкс», либо произвольный текст в поле «тариф». Этой же
 * очищенной заявкой пользуется создание брони в Yurta — в API отеля должен
 * уходить ровно тот набор гостей, что прошёл проверку.
 *
 * Отдельный модуль нужен, чтобы route handler оставался про HTTP, а правила
 * проверки можно было переиспользовать (например, в тестах или при импорте
 * заявок из CRM).
 */

import {
  MAX_GUESTS,
  MAX_NIGHTS,
  calcTotal,
  findRate,
  findRoomType,
  normalizePhoneDigits,
  phoneToE164,
  pricePerNight,
  roomTypeLabel,
  type BookingGuestInfo,
} from '@/lib/booking';
import type { StoredLead } from '@/lib/server/leads-store';

/** Откуда могли открыть форму: сверяем со списком, остальное помечаем «сайт» */
const KNOWN_SOURCES = ['hero', 'header', 'prices', 'contacts', 'site', 'admin'];

const LIMITS = {
  name: 80,
  surname: 80,
  patronymic: 80,
  passport: 60,
  passportIssuedBy: 200,
  address: 200,
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
  return year >= 1900 && year <= 2100;
}

/** Дата заезда не может быть в прошлом; для паспорта прошлое — норма */
function isFutureIsoDate(value: unknown): value is string {
  if (!isIsoDate(value)) return false;
  return Date.parse(`${value.slice(0, 10)}T00:00:00Z`) >= Date.now() - 86_400_000;
}

export type LeadParseResult = { ok: true; lead: StoredLead } | { ok: false; message: string };

export function parseLeadPayload(raw: unknown): LeadParseResult {
  if (!raw || typeof raw !== 'object') {
    return { ok: false, message: 'Тело заявки должно быть JSON-объектом' };
  }
  const body = raw as Record<string, unknown>;

  if (body.consent !== true) return { ok: false, message: 'Без согласия на обработку данных заявку принять нельзя' };

  if (!isFutureIsoDate(body.checkIn)) return { ok: false, message: 'Не понятна дата заезда' };
  const checkIn = String(body.checkIn).slice(0, 10);

  if (!isFutureIsoDate(body.checkOut)) return { ok: false, message: 'Не понятна дата выезда' };
  const checkOut = String(body.checkOut).slice(0, 10);

  const nights = Number(body.nights);
  if (!Number.isInteger(nights) || nights < 1 || nights > MAX_NIGHTS) {
    return { ok: false, message: `Количество ночей — от 1 до ${MAX_NIGHTS}` };
  }
  // Расхождение дат и счётчика ночей — признак подделанного запроса: доверяем датам
  if (Date.parse(checkOut) - Date.parse(checkIn) !== nights * 86_400_000) {
    return { ok: false, message: 'Даты заезда и выезда не совпадают с количеством ночей' };
  }

  const rate = findRate(String(body.rateId ?? ''));
  const room = findRoomType(String(body.roomTypeId ?? ''));
  if (findRate(rate.id).id !== rate.id || findRoomType(room.id).id !== room.id) {
    return { ok: false, message: 'Неизвестный тариф или категория номера' };
  }

  const guests = parseGuests(body.guests);
  if (!guests.ok) return { ok: false, message: guests.message };

  const extraGuests = Math.max(0, guests.value.length - 1);

  const source = KNOWN_SOURCES.includes(String(body.source)) ? String(body.source) : 'site';

  // Телефон основного гостя: в заявке храним и как набрали, и в E.164 для tel:
  const rawPhone = cleanText(guests.value[0]?.phone, LIMITS.phone);
  const digits = normalizePhoneDigits(rawPhone);

  // Сумму считаем сами: клиентская могла быть пересчитана в консоли
  const perNight = pricePerNight(rate, extraGuests);

  return {
    ok: true,
    lead: {
      leadId: '',
      status: 'new',
      submittedAt: new Date().toISOString(),

      guests: guests.value,
      phone: rawPhone,
      phoneE164: phoneToE164(digits),

      rateId: rate.id,
      ratePeriod: rate.period,
      roomTypeId: room.id,
      roomTypeLabel: roomTypeLabel(room),

      extraGuests,
      extraGuestsPrice: perNight - rate.price,

      checkIn,
      checkOut,
      nights,
      pricePerNight: perNight,
      total: calcTotal(rate, nights, extraGuests),

      comment: cleanText(body.comment, LIMITS.comment),
      source,
      consent: true,
    },
  };
}

/** Список гостей: первый обязан иметь ФИО, телефон и паспорт — он бронирует */
function parseGuests(raw: unknown): { ok: true; value: BookingGuestInfo[] } | { ok: false; message: string } {
  if (!Array.isArray(raw) || raw.length === 0) {
    return { ok: false, message: 'Нужен хотя бы один гость' };
  }
  if (raw.length > MAX_GUESTS) {
    return { ok: false, message: `Гостей в одной заявке — не больше ${MAX_GUESTS}` };
  }

  const value: BookingGuestInfo[] = raw.map((item) => {
    const g = (item ?? {}) as Record<string, unknown>;
    const issuedDate = isIsoDate(g.passportIssuedDate) ? String(g.passportIssuedDate).slice(0, 10) : '';
    const birthDate = isIsoDate(g.birthDate) ? String(g.birthDate).slice(0, 10) : '';
    return {
      surname: cleanText(g.surname, LIMITS.surname),
      name: cleanText(g.name, LIMITS.name),
      patronymic: cleanText(g.patronymic, LIMITS.patronymic),
      phone: cleanText(g.phone, LIMITS.phone),
      birthDate: birthDate || undefined,
      passport: cleanText(g.passport, LIMITS.passport),
      passportIssuedBy: cleanText(g.passportIssuedBy, LIMITS.passportIssuedBy),
      passportIssuedDate: issuedDate || undefined,
      address: cleanText(g.address, LIMITS.address),
    };
  });

  for (const [index, guest] of value.entries()) {
    const who = index === 0 ? 'Основной гость' : `Гость ${index + 1}`;
    if (!guest.surname || !guest.name) return { ok: false, message: `${who}: нужны фамилия и имя` };
    if (index === 0) {
      if (!guest.patronymic) return { ok: false, message: 'Основной гость: нужно отчество' };
      if (normalizePhoneDigits(guest.phone ?? '').length !== 10) {
        return { ok: false, message: 'Основной гость: нужен полный номер телефона' };
      }
      if (!guest.passport) return { ok: false, message: 'Основной гость: нужны серия и номер паспорта' };
    }
  }

  return { ok: true, value };
}