/**
 * Данные и логика онлайн-бронирования.
 *
 * Держим отдельно от компонента: тарифы и категории нужны и карточкам в секции
 * «Цены», и модалке, и серверу — он по этой же заявке пересчитывает сумму и
 * подбирает номер в Yurta. Цены суток берутся из тех же периодов, что
 * показывает секция «Цены», — чтобы в заявке не расходилась сумма с той, по
 * которой гость кликнул «Забронировать».
 */

import { pushLead } from '@/lib/leads';
import { isRoomBusy, type GridBooking, type GridRoom } from '@/lib/bookingGrid';

/** Категория номера. Цена не привязана: на сайте тариф «всё включено» единый. */
export type RoomType = {
  id: string;
  title: string;
  /** Тип кровати — выводится в скобках, как в исходном макете формы */
  beds: string;
  /** Сколько гостей размещается без доплаты */
  capacity: number;
};

export type Rate = {
  id: string;
  /** Подпись периода, например «Март — Апрель 2026» */
  period: string;
  /** Цена суток в рублях */
  price: number;
};

export const ROOM_TYPES: RoomType[] = [
  { id: 'single', title: 'Одноместный номер', beds: 'Одна кровать', capacity: 1 },
  { id: 'double', title: 'Двухместный номер', beds: 'Одна большая кровать', capacity: 2 },
  { id: 'twin', title: 'Двухместный номер', beds: 'Две кровати', capacity: 2 },
  { id: 'family', title: 'Семейный номер', beds: 'Две кровати + диван', capacity: 3 },
  { id: 'lux', title: 'Люкс', beds: 'Одна большая кровать + гостиная', capacity: 2 },
];

/** Те же тарифы, что в секции «Цены» */
export const RATES: Rate[] = [
  { id: 'jan-feb', period: 'Январь — Февраль 2026', price: 3500 },
  { id: 'mar-apr', period: 'Март — Апрель 2026', price: 3990 },
  { id: 'aug', period: 'Август 2026', price: 5000 },
];

/** Тариф по умолчанию — рекомендованный период из секции «Цены» */
export const DEFAULT_RATE_ID = 'mar-apr';
export const DEFAULT_ROOM_TYPE_ID = 'single';

/** Доплата за каждого дополнительного гостя, ₽ за сутки */
export const EXTRA_GUEST_PRICE = 1000;
export const MAX_EXTRA_GUESTS = 2;
export const MAX_NIGHTS = 30;

/** Больше гостей в одну заявку сайт не принимает: семейный номер — предел */
export const MAX_GUESTS = MAX_EXTRA_GUESTS + 1;

export function findRoomType(id: string): RoomType {
  return ROOM_TYPES.find((room) => room.id === id) ?? ROOM_TYPES[0];
}

export function findRate(id: string): Rate {
  return RATES.find((rate) => rate.id === id) ?? RATES[0];
}

/** «Одноместный номер (Одна кровать)» */
export function roomTypeLabel(room: RoomType): string {
  return `${room.title} (${room.beds})`;
}

/** 3990 → «3 990» — сумма и «р.» в дизайне разнесены */
export function formatPrice(value: number): string {
  return new Intl.NumberFormat('ru-RU').format(Math.round(value));
}

/** Склонение: 1 день, 3 дня, 10 дней */
export function pluralNights(value: number): string {
  const mod10 = value % 10;
  const mod100 = value % 100;
  if (mod10 === 1 && mod100 !== 11) return 'день';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'дня';
  return 'дней';
}

/** Склонение: 1 гость, 2 гостя, 5 гостей */
export function pluralGuests(value: number): string {
  const mod10 = value % 10;
  const mod100 = value % 100;
  if (mod10 === 1 && mod100 !== 11) return 'гость';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'гостя';
  return 'гостей';
}

/** Стоимость суток с учётом подселённых гостей */
export function pricePerNight(rate: Rate, extraGuests: number): number {
  const guests = extraGuests > 0 ? extraGuests : 0;
  return rate.price + EXTRA_GUEST_PRICE * guests;
}

/** Итого за весь заезд */
export function calcTotal(
  rate: Rate,
  nights: number,
  extraGuests: number,
): number {
  const safeNights = Number.isFinite(nights) && nights > 0 ? nights : 1;
  return pricePerNight(rate, extraGuests) * safeNights;
}

/**
 * Данные одного гостя. Первый гость — тот, кто заполняет форму: у него телефон и
 * паспорт обязательны, у спутников достаточно ФИО (паспорт можно дополнить).
 */
export type BookingGuestInfo = {
  surname: string;
  name: string;
  patronymic: string;
  phone?: string;
  birthDate?: string;
  /** Серия и номер одной строкой: «65 12 №123456» */
  passport?: string;
  passportIssuedBy?: string;
  /** Дата выдачи паспорта, YYYY-MM-DD */
  passportIssuedDate?: string;
  /** Адрес регистрации */
  address?: string;
};

/** Значения формы бронирования: ФИО и паспорт на каждого гостя, даты заезда */
export type BookingFormValues = {
  rateId: string;
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: BookingGuestInfo[];
  comment?: string;
  consent: boolean;
};

export type BookingPayload = {
  rateId: string;
  ratePeriod: string;
  roomTypeId: string;
  roomTypeLabel: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: BookingGuestInfo[];
  /** Телефон основного гостя — по нему звонит менеджер */
  phone: string;
  comment?: string;
  consent: boolean;
  pricePerNight: number;
  extraGuestsPrice: number;
  total: number;
  /** ISO-строка отправки — для отладки и сверки с CRM */
  submittedAt: string;
  /** Откуда открыли форму: hero | header | prices | contacts */
  source: string;
};

/** Код страны вынесен в префикс поля, в значении храним 10 цифр номера. */
export const PHONE_COUNTRY_CODE = '7';

/**
 * Только цифры абонентского номера (без кода страны), максимум 10.
 * Принимает и «8 913 340 55 66», и «+7 (913) 340-55-66», и «9133405566».
 */
export function normalizePhoneDigits(value: string): string {
  const raw = (value ?? '').replace(/\D/g, '');
  if (raw.length === 0) return '';
  if (raw.length > 10 && (raw.startsWith('7') || raw.startsWith('8'))) {
    return raw.slice(1, 11);
  }
  return raw.slice(0, 10);
}

/** (913) 340-55-66 — по мере ввода, без «+7» (он в префиксе поля) */
export function formatPhone(value: string): string {
  const d = normalizePhoneDigits(value);
  if (!d) return '';
  const parts = [d.slice(0, 3), d.slice(3, 6), d.slice(6, 8), d.slice(8, 10)];
  let result = '';
  if (parts[0]) result += `(${parts[0]}`;
  if (parts[0].length === 3) result += ')';
  if (parts[1]) result += ` ${parts[1]}`;
  if (parts[2]) result += `-${parts[2]}`;
  if (parts[3]) result += `-${parts[3]}`;
  return result;
}

/** Полный номер в формате E.164: +79133405566 */
export function phoneToE164(value: string): string {
  const digits = normalizePhoneDigits(value);
  return digits.length === 10 ? `+${PHONE_COUNTRY_CODE}${digits}` : '';
}

/** true, если набран полный номер */
export function isPhoneComplete(value: string): boolean {
  return normalizePhoneDigits(value).length === 10;
}

/** Номер ночей между датами заезда и выезда (ISO-строки) */
export function nightsBetweenDates(checkIn: string, checkOut: string): number {
  const start = Date.parse(checkIn);
  const end = Date.parse(checkOut);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 1;
  return Math.round((end - start) / 86_400_000);
}

/**
 * Подсказки для сопоставления категории сайта с названием типа номера в Yurta.
 *
 * Точного маппинга категорий сайта на room_type_id отеля нет, поэтому сначала
 * ищем номер, чьё название похоже на выбранную категорию, а среди прочих берём
 * самый дешёвый подходящей вместимости. Менеджер всегда может переставить гостя
 * в партнёрском кабинете — здесь важно не оставить заявку без брони.
 */
const CATEGORY_HINTS: Record<string, RegExp> = {
  single: /одноместн|single|стандарт/i,
  double: /двухместн|double|стандарт/i,
  twin: /двухместн|twin|две кроват|стандарт/i,
  family: /семейн|family|люкс|апартамент/i,
  lux: /люкс|lux|апартамент|suite/i,
};

/**
 * Свободная комната под заявку с сайта: не занята на эти даты и вмещает всех
 * гостей. Категория из формы — предпочтение, а не жёсткое требование: если
 * подходящих по названию нет, берём любую свободную нужной вместимости.
 */
export function pickRoomForLead(params: {
  roomTypeId: string;
  guests: number;
  rooms: GridRoom[];
  bookings: GridBooking[];
  checkIn: number;
  checkOut: number;
}): GridRoom | undefined {
  const { roomTypeId, guests, rooms, bookings, checkIn, checkOut } = params;
  const needed = Math.max(1, guests);
  const hint = CATEGORY_HINTS[roomTypeId];

  const free = rooms.filter(
    (room) =>
      !isRoomBusy(room.id, bookings, checkIn, checkOut) &&
      (room.capacity <= 0 || room.capacity >= needed),
  );
  if (free.length === 0) return undefined;

  const score = (room: GridRoom): number => {
    const name = `${room.roomTypeName ?? ''} ${room.name ?? ''}`;
    const matchesCategory = hint && hint.test(name) ? 0 : 1;
    // Сначала совпадение по категории, затем вместимость «впритык», затем цена
    const capacityGap = room.capacity > 0 ? room.capacity - needed : 99;
    return matchesCategory * 1000 + capacityGap * 100 + room.price;
  };

  return [...free].sort((a, b) => score(a) - score(b))[0];
}

/**
 * Отправка заявки.
 *
 * Заявка уходит на сервер сайта (POST /api/leads) — только там её увидит
 * менеджер в кабинете /admin. Сервер же создаёт бронь в Yurta: гостю для этого
 * не нужен доступ к API отеля, а менеджер видит заезд сразу в шахматке. Если
 * приёмник недоступен, lib/leads.ts кладёт заявку в localStorage этого браузера,
 * и форма всё равно подтверждается — заявку не должно терять молча.
 */
export async function submitBooking(payload: BookingPayload): Promise<void> {
  const { onServer } = await pushLead(payload);

  if (!onServer) {
    console.warn('[booking] сервер недоступен, заявка сохранена локально:', payload);
    return;
  }

  const endpoint = process.env.NEXT_PUBLIC_BOOKING_WEBHOOK;
  if (!endpoint) return;

  // Необязательный дубль во внешний приёмник (Telegram-бот, CRM)
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Не удалось отправить заявку: ${response.status}`);
  }
}
