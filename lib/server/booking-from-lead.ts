/**
 * Бронь Yurta из заявки с сайта.
 *
 * Заявку принял сервер (app/api/leads/route.ts) — здесь она превращается в
 * реальный заезд отеля: по датам берём решётку под сервисным аккаунтом, находим
 * свободный номер под выбранную категорию и количество гостей и создаём бронь
 * через /v2/booking/room/prepaid. Бронь сразу видна в шахматке админки.
 *
 * Ошибка создания не отменяет заявку: гость уже увидел подтверждение, а менеджер
 * должен видеть заявку даже при недоступном API. Поэтому сбой попадает в
 * bookingError, и заявка остаётся в списке как «Новая».
 */

import { toUnix } from '@/lib/datetime';
import { pickRoomForLead, type BookingGuestInfo } from '@/lib/booking';
import { GRID_LOOKBACK_DAYS } from '@/lib/bookingGrid';
import { createServerBooking, fetchServerGrid, yurtaConfigured, YurtaError } from '@/lib/server/yurta';
import type { StoredLead } from '@/lib/server/leads-store';

const DAY = 86_400;

export type BookingAttempt =
  | { ok: true; bookingId: number | undefined }
  | { ok: false; message: string };

/**
 * Создаёт бронь по заявке и возвращает её id.
 *
 * Окно решётки берём с тем же запасом назад, что и админка: сервер отбирает
 * брони по дате заезда, поэтому без запаса уже идущие заезды не попали бы в
 * ответ, и свободный номер оказался бы на самом деле занят.
 */
export async function createBookingFromLead(lead: StoredLead): Promise<BookingAttempt> {
  if (!yurtaConfigured()) {
    return { ok: false, message: 'Бронирование недоступно: не заданы доступы к API отеля' };
  }

  const checkIn = toUnix(`${String(lead.checkIn)}T00:00:00`);
  const checkOut = toUnix(`${String(lead.checkOut)}T00:00:00`);
  if (!checkIn || !checkOut || checkOut <= checkIn) {
    return { ok: false, message: 'Не удалось определить даты заезда' };
  }

  const guests: BookingGuestInfo[] = Array.isArray(lead.guests)
    ? (lead.guests as BookingGuestInfo[])
    : [];
  const guestCount = guests.length || 1 + Number(lead.extraGuests ?? 0);

  try {
    const grid = await fetchServerGrid({
      checkIn: checkIn - GRID_LOOKBACK_DAYS * DAY,
      checkOut: checkOut + DAY,
    });

    const room = pickRoomForLead({
      roomTypeId: String(lead.roomTypeId ?? ''),
      guests: guestCount,
      rooms: grid.rooms,
      bookings: grid.bookings,
      checkIn,
      checkOut,
    });

    if (!room) {
      return {
        ok: false,
        message: `На ${lead.checkIn} нет свободного номера под ${guestCount} гост. — заявку обработает менеджер`,
      };
    }

    const bookingId = await createServerBooking({
      checkIn,
      checkOut,
      roomIds: [room.id],
      capacity: guestCount,
      guests: guests.map((guest) => ({
        surname: String(guest?.surname ?? ''),
        name: String(guest?.name ?? ''),
        patronymic: String(guest?.patronymic ?? ''),
        phone: guest?.phone ? String(guest.phone) : undefined,
        birthDate: guest?.birthDate ? String(guest.birthDate) : undefined,
        passport: guest?.passport ? String(guest.passport) : undefined,
        passportIssuedBy: guest?.passportIssuedBy ? String(guest.passportIssuedBy) : undefined,
        passportIssuedDate: guest?.passportIssuedDate ? String(guest.passportIssuedDate) : undefined,
        address: guest?.address ? String(guest.address) : undefined,
      })),
      comment: buildComment(lead),
    });

    return { ok: true, bookingId };
  } catch (error) {
    const message =
      error instanceof YurtaError
        ? error.message
        : error instanceof Error
          ? error.message
          : 'Не удалось создать бронь';
    console.error('[booking-from-lead] бронь не создана:', error);
    return { ok: false, message };
  }
}

/** Комментарий к брони: контекст заявки, чтобы менеджер понимал её происхождение */
function buildComment(lead: StoredLead): string {
  const source = String(lead.source ?? 'site');
  const comment = String(lead.comment ?? '').trim();
  const parts = [`Заявка с сайта (${source})`];
  if (comment) parts.push(comment);
  return parts.join(': ');
}
