/**
 * Контракт бронирований Yurta: типы и разбор ответа решётки.
 *
 * Модуль общий для браузера и сервера. Админка читает решётку под токеном
 * менеджера (lib/bookingApi.ts), а сервер сайта создаёт брони под сервисным
 * аккаунтом отеля (lib/server/yurta.ts) — оба места обязаны разбирать ответ
 * одинаково, поэтому нормализация живёт здесь, а не в клиентском слое.
 *
 * Даты API принимает и отдаёт в unix-секундах, поля приходят в snake_case —
 * нормализуем в camelCase на границе, читая оба написания: бэкенд менял
 * сериализатор, и полагаться на одно нельзя.
 */

import dayjs, { type Dayjs } from 'dayjs';
import { fromUnix } from '@/lib/datetime';

export type BookingGuest = {
  id?: string | number;
  surname: string;
  name: string;
  patronymic?: string;
  phone?: string;
  email?: string;
  /** Паспортные данные и адрес приходят одной строкой от бэкенда */
  additionalInfo?: string;
};

export type GridRoom = {
  id: number;
  name: string;
  number: string;
  price: number;
  capacity: number;
  buildingName?: string;
  roomTypeId?: number;
  roomTypeName?: string;
};

export type GridBooking = {
  id: number;
  roomId: number;
  /** unix-секунды */
  checkIn: number;
  checkOut: number;
  dateCreated?: number;
  status: string;
  paymentStatus?: string;
  totalAmount: number;
  comment: string;
  guests: BookingGuest[];
};

export type BookingGrid = {
  rooms: GridRoom[];
  bookings: GridBooking[];
};

/** Период решётки в unix-секундах */
export type GridPeriod = { checkIn: number; checkOut: number };

/**
 * Насколько расширять запрос решётки назад от нужного начала.
 *
 * Сервер отбирает брони по дате заезда: окно «сегодня — +14 дней» не вернёт
 * гостя, который заехал неделю назад и всё ещё живёт. Без запаса админка
 * потеряла бы уже идущие заезды, а форма создания брони предложила бы занятый
 * номер. Месяц покрывает длинные путёвки (у санатория курс до 21 дня).
 */
export const GRID_LOOKBACK_DAYS = 31;

type Loose = Record<string, unknown>;

const pick = <T>(raw: Loose, ...keys: string[]): T | undefined => {
  for (const key of keys) {
    const value = raw[key];
    if (value !== undefined && value !== null) return value as T;
  }
  return undefined;
};

const toNumber = (value: unknown): number => {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export function normalizeGuest(raw: unknown): BookingGuest {
  const g = (raw ?? {}) as Loose;
  return {
    id: pick<string | number>(g, 'id'),
    surname: String(pick<string>(g, 'surname') ?? ''),
    name: String(pick<string>(g, 'name') ?? ''),
    patronymic: pick<string>(g, 'patronymic') ?? undefined,
    phone: pick<string>(g, 'phone') ?? undefined,
    email: pick<string>(g, 'email') ?? undefined,
    additionalInfo: pick<string>(g, 'additionalInfo', 'additional_info') ?? undefined,
  };
}

export function normalizeBooking(raw: unknown): GridBooking {
  const b = (raw ?? {}) as Loose;
  return {
    id: toNumber(pick(b, 'id')),
    roomId: toNumber(pick(b, 'room_id', 'roomId')),
    checkIn: toNumber(pick(b, 'check_in', 'checkIn')),
    checkOut: toNumber(pick(b, 'check_out', 'checkOut')),
    dateCreated: pick<number>(b, 'date_created', 'dateCreated') !== undefined
      ? toNumber(pick(b, 'date_created', 'dateCreated'))
      : undefined,
    status: String(pick<string>(b, 'status') ?? 'NEW'),
    paymentStatus: pick<string>(b, 'payment_status', 'paymentStatus') ?? undefined,
    totalAmount: toNumber(pick(b, 'total_amount', 'totalAmount')),
    comment: String(pick<string>(b, 'comment') ?? ''),
    guests: (pick<unknown[]>(b, 'guests') ?? []).map(normalizeGuest),
  };
}

export function normalizeRoom(raw: unknown): GridRoom {
  const r = (raw ?? {}) as Loose;
  return {
    id: toNumber(pick(r, 'id')),
    name: String(pick<string>(r, 'name') ?? ''),
    number: String(pick<string>(r, 'number') ?? ''),
    price: toNumber(pick(r, 'price')),
    capacity: toNumber(pick(r, 'capacity')),
    buildingName: pick<string>(r, 'building_name', 'buildingName') ?? undefined,
    roomTypeId: pick<number>(r, 'room_type_id', 'roomTypeId') !== undefined
      ? toNumber(pick(r, 'room_type_id', 'roomTypeId'))
      : undefined,
    roomTypeName: pick<string>(r, 'room_type_name', 'roomTypeName') ?? undefined,
  };
}

/** Решётка из «сырого» ответа API: комнаты и брони за период */
export function normalizeGrid(raw: { rooms?: unknown[]; bookings?: unknown[] } | null | undefined): BookingGrid {
  return {
    rooms: (raw?.rooms ?? []).map(normalizeRoom),
    bookings: (raw?.bookings ?? []).map(normalizeBooking),
  };
}

/**
 * Бронь занимает комнату в окне [windowStart; windowEnd) хотя бы одну ночь.
 *
 * Сверка по пересечению, а не по дате заезда: гость, заехавший вчера и живущий
 * ещё неделю, для окна «сегодня — +14 дней» уже забронирован, хотя его заезд в
 * окно не попадает.
 */
export function stayOverlapsWindow(stay: GridBooking, windowStart: number, windowEnd: number): boolean {
  return stay.checkIn < windowEnd && stay.checkOut > windowStart;
}

/** Живёт ли гость в номере в указанный момент (заезд сегодня — уже живёт) */
export function isGuestInHouse(stay: GridBooking, at: Dayjs = dayjs()): boolean {
  const start = fromUnix(stay.checkIn);
  const end = fromUnix(stay.checkOut);
  return !at.isBefore(start, 'day') && at.isBefore(end, 'day');
}

/** Отменённую бронь не считаем занятостью и не подсвечиваем как заезд */
export function isCancelledStay(stay: GridBooking): boolean {
  return /CANCEL/i.test(stay.status);
}

/** Комната занята, если её бронь пересекается с [checkIn, checkOut) */
export function isRoomBusy(
  roomId: number,
  bookings: GridBooking[],
  checkIn: number,
  checkOut: number,
): boolean {
  return bookings.some(
    (booking) =>
      booking.roomId === roomId &&
      !isCancelledStay(booking) &&
      booking.checkIn < checkOut &&
      checkIn < booking.checkOut,
  );
}

/** Подпись статуса из решётки — те же варианты, что разбирает BookingGrid */
export function bookingStatusLabel(status: string): string {
  if (/CHECKED_IN|CHECKEDIN|OCCUPIED|IN_HOUSE/i.test(status)) return 'Заселён';
  if (/CHECKED_OUT|CHECKEDOUT|VACATED|DEPARTED|COMPLETED/i.test(status)) return 'Выселен';
  if (/PAID/i.test(status)) return 'Оплачен';
  if (/CANCEL/i.test(status)) return 'Отменён';
  if (/DRAFT/i.test(status)) return 'Черновик';
  return 'Не оплачен';
}

/** «Иванова Мария» — как в списке броней */
export function guestLabel(guest: BookingGuest): string {
  const parts = [guest.surname, guest.name].filter(Boolean);
  return parts.length > 0 ? parts.join(' ') : 'Без имени';
}

export function guestsLabel(bookings: GridBooking): string {
  return bookings.guests.map(guestLabel).join(', ') || '—';
}
