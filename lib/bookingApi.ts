/**
 * Клиентский доступ админки к бронированиям Yurta.
 *
 * Контракт (типы, разбор ответа решётки, подписи статусов) живёт в
 * lib/bookingGrid.ts — тот же модуль читает и сервер сайта, создавая брони из
 * заявок гостей. Здесь остаётся только то, что нужно браузеру менеджера:
 * запросы под Bearer-токеном сессии и создание брони из формы /admin/new.
 *
 *   GET  /v4/booking/grid?check_in=&check_out=  — комнаты и брони за период
 *   POST /v2/booking/room/prepaid               — создание брони (предоплата)
 *
 * Даты API принимает и отдаёт в unix-секундах.
 */

import { apiRequest } from '@/lib/api';
import { normalizeGrid, type BookingGrid, type GridPeriod } from '@/lib/bookingGrid';
import type { BookingGuestInfo } from '@/lib/booking';

export * from '@/lib/bookingGrid';

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

  return normalizeGrid(data);
}

/** Гость для создания брони: паспортные данные бэкенд ждёт одной строкой */
export type CreateBookingGuest = BookingGuestInfo;

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

/** «Паспорт: 65 12 №123456, выдан ...; Адрес: ...» — одним полем additionalInfo */
export function passportInfo(guest: CreateBookingGuest): string {
  const passport = [
    guest.passport ? `Паспорт: ${guest.passport}` : null,
    guest.passportIssuedBy ? `выдан: ${guest.passportIssuedBy}` : null,
    guest.passportIssuedDate ? `дата выдачи: ${guest.passportIssuedDate}` : null,
  ]
    .filter(Boolean)
    .join(', ');

  return [
    guest.birthDate ? `Дата рождения: ${guest.birthDate}` : null,
    passport || null,
    guest.address ? `Адрес прописки: ${guest.address}` : null,
  ]
    .filter(Boolean)
    .join('; ');
}

export function guestPayload(guest: CreateBookingGuest): Record<string, unknown> {
  const info = passportInfo(guest);

  return {
    surname: guest.surname ?? '',
    name: guest.name ?? '',
    patronymic: guest.patronymic ?? '',
    phone: guest.phone ?? '',
    ...(info && { additionalInfo: info }),
  };
}

/** Тело создания брони — один контракт и для админки, и для сервера сайта */
export function bookingRequestBody(dto: CreateBookingDto): Record<string, unknown> {
  return {
    check_in: dto.checkIn,
    check_out: dto.checkOut,
    rooms: dto.roomIds.map((id) => ({ id })),
    capacity: dto.capacity,
    payment_reference: dto.paymentReference ?? '',
    comment: dto.comment ?? '',
    guests: dto.guests.map(guestPayload),
  };
}

/** Id из ответа создания: бэкенд отдавал и { id }, и вложенным { data: { id } } */
export function createdBookingId(data: { id?: number; data?: { id?: number } } | null | undefined): number | undefined {
  return data?.id ?? data?.data?.id;
}

/**
 * Бронь «под предоплату» — тот же эндпоинт, что и в кабинете партнёра.
 * Санаторий подтверждает заезд после предоплаты 100%, поэтому статус новой
 * брони после создания — NEW (не оплачено), менеджер переводит её в кабинете.
 */
export async function createBooking(dto: CreateBookingDto): Promise<number | undefined> {
  const data = await apiRequest<{ id?: number; data?: { id?: number } }>(
    '/v2/booking/room/prepaid',
    { method: 'POST', body: bookingRequestBody(dto) },
  );

  return createdBookingId(data);
}