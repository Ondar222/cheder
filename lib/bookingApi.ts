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
import { normalizeGrid, type BookingGrid, type GridPeriod, type GridBooking } from '@/lib/bookingGrid';
import type { BookingGuestInfo } from '@/lib/booking';
import { rememberCreatedBooking, readCreatedBookings } from '@/lib/createdBookings';

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
  console.log('[bookingApi] окна:', JSON.stringify({ total: settled.length, ok: ok.length, failed, rooms: grid.rooms.length, bookings: grid.bookings.length }));

  // Добавляем локально созданные брони (которые ещё не вернулись из API)
  const localBookings = readCreatedBookings();
  const apiIds = new Set(grid.bookings.map((b) => b.id));
  const stillLocal = localBookings.filter((b) => !apiIds.has(b.id));
  if (stillLocal.length > 0) {
    console.log('[bookingApi] добавляем локальные брони:', stillLocal.length);
    return { rooms: grid.rooms, bookings: [...grid.bookings, ...stillLocal] };
  }

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

  // API требует email, но пустая строка не проходит валидацию.
  // Если email не введён — используем общий контакт отеля.
  const EMAIL_FALLBACK = 'booking@cheder.ru';

  return {
    surname: guest.surname ?? '',
    name: guest.name ?? '',
    patronymic: guest.patronymic ?? '',
    phone: guest.phone ?? '',
    email: guest.email ? String(guest.email).trim() : EMAIL_FALLBACK,
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
 *
 * После создания бронь сохраняется в локальный склад — менеджер видит её
 * в админке сразу, не дожидаясь, пока API вернёт в решётке.
 */
export async function createBooking(dto: CreateBookingDto): Promise<number | undefined> {
  const data = await apiRequest<{ id?: number; data?: { id?: number } }>(
    '/v2/booking/room/prepaid',
    { method: 'POST', body: bookingRequestBody(dto) },
  );

  const id = createdBookingId(data);
  console.log('[bookingApi] бронь создана:', JSON.stringify({ id, response: data }));

  // Сохраняем в локальный склад — бронь появится в админке сразу
  if (id) {
    rememberCreatedBooking({
      id,
      roomId: dto.roomIds[0] ?? 0,
      checkIn: dto.checkIn,
      checkOut: dto.checkOut,
      status: 'NEW',
      totalAmount: 0,
      comment: dto.comment ?? '',
      guests: dto.guests.map((g) => ({
        surname: g.surname ?? '',
        name: g.name ?? '',
        patronymic: g.patronymic ?? '',
        phone: g.phone ?? '',
      })),
    });
  }

  return id;
}

/**
 * Подбор категории заявки на категорию номера Yurta.
 *
 * Заявка с сайта не хранит roomTypeId — это поле формы бронирования.
 * Здесь мы ищем тип номера, чьё название похоже на выбранную категорию.
 */
const LEAD_ROOM_HINTS: Record<string, RegExp> = {
  single: /одноместн|single|стандарт/i,
  double: /двухместн|double|стандарт/i,
  twin: /двухместн|twin|две кроват|стандарт/i,
  family: /семейн|family|люкс|апартамент/i,
  lux: /люкс|lux|апартамент|suite/i,
};

/**
 * Создать бронь из заявки с сайта под токеном менеджера.
 *
 * Сервер не может создать бронь (пустые YURTA_API_EMAIL/PASSWORD), поэтому
 * менеджер вручную переводит заявку в «В броне» и нажимает «Создать».
 *
 * Алгоритм:
 * 1. Получаем решётку (комнаты + брони) под токеном менеджера
 * 2. Подбираем комнату: не занята на даты, нужная вместимость
 * 3. Создаём бронь через /v2/booking/room/prepaid
 */
export async function createBookingFromLead(lead: {
  checkIn: string | number;
  checkOut: string | number;
  guests: { name?: string; surname?: string; patronymic?: string; phone?: string; email?: string }[];
  phone?: string;
  comment?: string;
}): Promise<{ ok: true; bookingId: number } | { ok: false; message: string }> {
  const { checkIn, checkOut, guests, phone, comment } = lead;

  const checkInUnix =
    typeof checkIn === 'number' ? checkIn : Math.floor(new Date(checkIn).getTime() / 1000);
  const checkOutUnix =
    typeof checkOut === 'number' ? checkOut : Math.floor(new Date(checkOut).getTime() / 1000);

  if (!checkInUnix || !checkOutUnix || checkOutUnix <= checkInUnix) {
    return { ok: false, message: 'Не удалось определить даты заезда' };
  }

  // Получаем решётку
  let grid: { rooms: { id: number; capacity?: number; roomTypeName?: string; name?: string; price?: number }[]; bookings: { id: number; roomId: number; checkIn: number; checkOut: number }[] };
  try {
    const gridData = await fetchBookingGrid({
      checkIn: checkInUnix - 30 * 86_400,
      checkOut: checkOutUnix + 86_400,
    });
    grid = { rooms: gridData.rooms, bookings: gridData.bookings };
  } catch {
    return { ok: false, message: 'Не удалось загрузить список номеров' };
  }

  const guestCount = (guests?.length ?? 1) || 1;
  const firstGuest = guests?.[0] ?? { name: '', surname: '', patronymic: '', phone: '' };

  // Подбираем комнату: не занята на даты, нужная вместимость
  const freeRooms = grid.rooms.filter((room) => {
    const busy = grid.bookings.some(
      (b) =>
        b.roomId === room.id &&
        !(checkOutUnix <= b.checkIn || checkInUnix >= b.checkOut),
    );
    return !busy && (room.capacity === undefined || room.capacity >= guestCount);
  });

  if (freeRooms.length === 0) {
    return {
      ok: false,
      message: `На ${new Date(checkInUnix * 1000).toLocaleDateString('ru-RU')} нет свободного номера под ${guestCount} гост.`,
    };
  }

  const room = freeRooms[0];

  // Создаём бронь
  const bookingId = await createBooking({
    checkIn: checkInUnix,
    checkOut: checkOutUnix,
    roomIds: [room.id],
    capacity: guestCount,
    guests: [
      {
        surname: firstGuest.surname ?? '',
        name: firstGuest.name ?? '',
        patronymic: firstGuest.patronymic ?? '',
        phone: phone ?? firstGuest.phone ?? '',
        email: firstGuest.email ?? '',
      },
    ],
    comment: comment ?? `Заявка с сайта: ${phone}`,
  });

  if (!bookingId) {
    return { ok: false, message: 'Не удалось создать бронь в API отеля' };
  }

  return { ok: true, bookingId };
}

/**
 * Удаление брони по id.
 *
 * API Yurta принимает DELETE /v2/booking/{id} — бронь удаляется из системы
 * полностью (не отменяется). Статусы брони API менять не позволяет — только
 * через партнёрский кабинет.
 */
export async function deleteBooking(id: number): Promise<void> {
  await apiRequest<unknown>(`/v2/booking/${id}`, { method: 'DELETE' });
}