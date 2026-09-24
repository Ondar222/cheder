/**
 * Данные и логика онлайн-бронирования.
 *
 * Держим отдельно от компонента: тарифы и категории нужны и карточкам в секции
 * «Цены», и модалке, и будущему бэкенду. Цены суток берутся из тех же периодов,
 * что показывает секция «Цены» — чтобы в заявке не расходилась сумма с той,
 * по которой гость кликнул «Забронировать».
 */

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

export type BookingFormValues = {
  rateId: string;
  roomTypeId: string;
  name: string;
  surname: string;
  phone: string;
  hasExtraGuest: 'yes' | 'no';
  extraGuests?: number;
  checkIn: string;
  nights: number;
  comment?: string;
  consent: boolean;
};

export type BookingPayload = BookingFormValues & {
  ratePeriod: string;
  roomTypeLabel: string;
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

/**
 * Отправка заявки.
 *
 * Бэкенда у сайта пока нет, поэтому приёмник задаётся переменной
 * NEXT_PUBLIC_BOOKING_WEBHOOK (Telegram-бот, CRM, свой API — что угодно,
 * принимающее JSON). Без переменной заявка остаётся в консоли, но гость всё
 * равно видит подтверждение: форма не должна «молча» терять людей.
 */
export async function submitBooking(payload: BookingPayload): Promise<void> {
  const endpoint = process.env.NEXT_PUBLIC_BOOKING_WEBHOOK;

  if (!endpoint) {
    console.info('[booking] NEXT_PUBLIC_BOOKING_WEBHOOK не задан, заявка:', payload);
    return;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Не удалось отправить заявку: ${response.status}`);
  }
}