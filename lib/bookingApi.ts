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
 * Максимальная длина окна решётки, которое принимает API: на более длинный
 * период /v4/booking/grid отвечает 400 с «Booking grid period must be 62 days
 * or less». Доски админки запрошены квартал с запасом назад, поэтому длинный
 * запрос режем на окна и склеиваем ответы.
 */
const MAX_GRID_WINDOW_DAYS = 60;
const DAY_SECONDS = 86_400;

/**
 * Нарезка периода на окна не длиннее лимита API. Частное округляем вверх и
 * делим период ровно: иначе из 121 дня вышли бы окна 60+60+1 — лишний запрос
 * почти впустую.
 */
function chunkPeriod(period: GridPeriod): GridPeriod[] {
  const total = period.checkOut - period.checkIn;
  const max = MAX_GRID_WINDOW_DAYS * DAY_SECONDS;
  if (total <= max) return [period];

  const count = Math.ceil(total / max);
  const size = Math.ceil(total / count / DAY_SECONDS) * DAY_SECONDS;

  const windows: GridPeriod[] = [];
  for (let start = period.checkIn; start < period.checkOut; start += size) {
    windows.push({ checkIn: start, checkOut: Math.min(start + size, period.checkOut) });
  }
  return windows;
}

async function fetchGridWindow(period: GridPeriod): Promise<RawGridResponse> {
  return apiRequest<RawGridResponse>('/v4/booking/grid', {
    query: { check_in: period.checkIn, check_out: period.checkOut },
  });
}

/** Склейка окон: комнаты и брони дедуплицируем по id — границы окон пересекаются */
function mergeRawGrids(responses: RawGridResponse[]): BookingGrid {
  const roomsById = new Map<number, unknown>();
  const bookingsById = new Map<number, unknown>();

  for (const response of responses) {
    for (const room of response.rooms ?? []) {
      const id = (room as { id?: number }).id;
      if (id !== undefined) roomsById.set(Number(id), room);
    }
    for (const booking of response.bookings ?? []) {
      const id = (booking as { id?: number }).id;
      if (id !== undefined) bookingsById.set(Number(id), booking);
    }
  }

  return normalizeGrid({
    rooms: [...roomsById.values()],
    bookings: [...bookingsById.values()],
  });
}

/**
 * Комнаты и брони за период. Комнаты приходят все вместе с бронями, поэтому
 * этой же решётки хватает и для списка заездов, и для выбора комнаты при
 * создании — свободна комната или нет видно сразу.
 *
 * Длинный период режем на окна: API отвечает 400 на запрос длиннее
 * MAX_GRID_WINDOW_DAYS, а доска по умолчанию показывает квартал с запасом.
 *
 * Окна склеиваем через allSettled: одно неудачное окно не должно обнулять всю
 * доску — менеджер увидит броней меньше, чем есть, и не поймёт, что произошло.
 * Ошибкой считаем только полный отказ всех окон.
 */
export async function fetchBookingGrid(period: GridPeriod): Promise<BookingGrid> {
  const windows = chunkPeriod(period);
  if (windows.length <= 1) {
    return normalizeGrid(await fetchGridWindow(period));
  }

  const settled = await Promise.allSettled(windows.map(fetchGridWindow));
  const ok = settled
    .filter((r): r is PromiseFulfilledResult<RawGridResponse> => r.status === 'fulfilled')
    .map((r) => r.value);
  const failed = settled.length - ok.length;

  if (ok.length === 0) {
    // Все окна упали — пробуем один общий запрос, чтобы получить текст ошибки
    // от API, а не «тихую» пустоту
    return normalizeGrid(await fetchGridWindow(windows[0]));
  }

  const grid = mergeRawGrids(ok);
  console.log('[bookingApi] окна:', { total: settled.length, ok: ok.length, failed, rooms: grid.rooms.length, bookings: grid.bookings.length });
  return grid;
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

/**
 * Гость для API Yurta (GuestCreateDto).
 *
 * Поле email обязательно: без него /v2/booking/room/prepaid отвечает 400, и
 * бронь молча не создаётся — менеджер видел «успех» формы и пустую шахматку.
 * Пустую строку шлём всегда, чтобы состав тела не зависел от того, заполнил
 * ли менеджер поле.
 *
 * Паспортные данные дублируем: структурированными полями (родитель видит их в
 * карточке гостя) и строкой в additionalInfo (так исторически reads админка).
 */
export function guestPayload(guest: CreateBookingGuest): Record<string, unknown> {
  const info = passportInfo(guest);

  return {
    surname: guest.surname ?? '',
    name: guest.name ?? '',
    patronymic: guest.patronymic ?? '',
    phone: guest.phone ?? '',
    email: guest.email ?? '',
    ...(guest.birthDate && { birthDate: guest.birthDate }),
    ...(guest.passport && { passport: guest.passport }),
    ...(guest.passportIssuedBy && { passportIssuedBy: guest.passportIssuedBy }),
    ...(guest.address && { registrationAddress: guest.address }),
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