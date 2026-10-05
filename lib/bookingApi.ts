/**
 * Контракт бронирований Yurta, нужный админке санатория.
 *
 * Снято с partners-next (src/entities/event/api/useEventApi.ts,
 * src/entities/booking/api/useBookingApi.ts), чтобы админка сайта и кабинет
 * партнёра говорили с API одинаково:
 *
 *   GET  /v4/booking/grid?check_in=&check_out=  — комнаты и брони за период
 *   POST /v2/booking/room/prepaid               — создание брони (предоплата)
 *
 * Даты API принимает и отдаёт в unix-секундах, поля приходят в snake_case —
 * нормализуем в camelCase на границе, читая оба написания: бэкенд менял
 * сериализатор, и полагаться на одно нельзя.
 */

import { apiRequest } from '@/lib/api';

export type BookingGuest = {
  id?: string | number;
  surname: string;
  name: string;
  patronymic?: string;
  phone?: string;
  email?: string;
  /** Дата рождения и адрес прописки приходят одной строкой от бэкенда */
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

function normalizeGuest(raw: unknown): BookingGuest {
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

function normalizeBooking(raw: unknown): GridBooking {
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

function normalizeRoom(raw: unknown): GridRoom {
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

type RawGridResponse = {
  rooms?: unknown[];
  bookings?: unknown[];
};

/**
 * Комнаты и брони за период. Комнаты приходят все вместе с бронями, поэтому
 * этой же решётки хватает и для списка заездов, и для выбора комнаты при
 * создании — свободна комната или нет видно сразу.
 */
export async function fetchBookingGrid(period: GridPeriod): Promise<BookingGrid> {
  const data = await apiRequest<RawGridResponse>('/v4/booking/grid', {
    query: { check_in: period.checkIn, check_out: period.checkOut },
  });

  return {
    rooms: (data?.rooms ?? []).map(normalizeRoom),
    bookings: (data?.bookings ?? []).map(normalizeBooking),
  };
}

/** Гость для создания: паспортные данные бэкенд ждёт одной строкой */
export type CreateBookingGuest = {
  surname: string;
  name: string;
  patronymic?: string;
  phone?: string;
  email?: string;
  birthDate?: string;
  address?: string;
};

export type CreateBookingDto = {
  /** unix-секунды */
  checkIn: number;
  checkOut: number;
  roomIds: number[];
  capacity: number;
  guests: CreateBookingGuest[];
  comment?: string;
  paymentReference?: string;
};

function guestPayload(guest: CreateBookingGuest): Loose {
  const passport = [
    guest.birthDate ? `Дата рождения: ${guest.birthDate}` : null,
    guest.address ? `Адрес прописки: ${guest.address}` : null,
  ]
    .filter(Boolean)
    .join('; ');

  return {
    surname: guest.surname ?? '',
    name: guest.name ?? '',
    patronymic: guest.patronymic ?? '',
    phone: guest.phone ?? '',
    email: guest.email ?? '',
    ...(passport && { additionalInfo: passport }),
  };
}

/**
 * Бронь «под предоплату» — тот же эндпоинт, что и в кабинете партнёра.
 * Санаторий подтверждает заезд после предоплаты 100%, поэтому статус новой
 * брони после создания — NEW (не оплачено), менеджер переводит её в кабинете.
 */
export async function createBooking(dto: CreateBookingDto): Promise<number | undefined> {
  const data = await apiRequest<{ id?: number; data?: { id?: number } }>(
    '/v2/booking/room/prepaid',
    {
      method: 'POST',
      body: {
        check_in: dto.checkIn,
        check_out: dto.checkOut,
        rooms: dto.roomIds.map((id) => ({ id })),
        capacity: dto.capacity,
        payment_reference: dto.paymentReference ?? '',
        comment: dto.comment ?? '',
        guests: dto.guests.map(guestPayload),
      },
    },
  );

  // Ответ бывал и { id }, и вложенным { data: { id } } — читаем оба варианта
  return data?.id ?? data?.data?.id;
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
