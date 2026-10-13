/**
 * Локальный склад броней, созданных из кабинета менеджера.
 *
 * Когда менеджер создаёт бронь через /admin/new или переводит заявку в «В броне»
 * на /admin, бронь сразу пишется в localStorage. Это нужно для двух вещей:
 * 1. Менеджер видит бронь в админке сразу, не дожидаясь, пока API вернёт её
 *    в решётке /v4/booking/grid (иногда это занимает несколько секунд).
 * 2. Если API временно недоступен, бронь всё равно видна в кабинете — менеджер
 *    поймёт, что создал, и может перезвонить гостю.
 *
 * Когда API начнёт отдавать эту бронь в решётке — дедупликация по id уберёт
 * локальную запись, и бронь будет показана только из API.
 */

import type { GridBooking, BookingGuest } from '@/lib/bookingGrid';

const STORAGE_KEY = 'cheder_created_bookings';

/** Прочитать все локально созданные брони */
export function readCreatedBookings(): GridBooking[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as GridBooking[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Сохранить список локальных броней */
function writeCreatedBookings(bookings: GridBooking[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
  } catch {
    // Хранилище переполнено — не должно ломать работу
  }
}

/** Добавить созданную бронь в локальный склад */
export function rememberCreatedBooking(booking: GridBooking): void {
  const existing = readCreatedBookings();
  const next = existing.filter((b) => b.id !== booking.id);
  writeCreatedBookings([booking, ...next]);
}

/** Удалить бронь из локального склада (когда API её уже отдал) */
export function forgetCreatedBooking(id: number): void {
  const existing = readCreatedBookings();
  writeCreatedBookings(existing.filter((b) => b.id !== id));
}

/**
 * Объединить API-брони с локально созданными:
 * - Локальная бронь, которой нет в API — добавляется в список
 * - Локальная бронь, которая теперь в API — удаляется из локальной копии
 */
export function mergeCreatedBookings(apiBookings: GridBooking[]): GridBooking[] {
  const apiIds = new Set(apiBookings.map((b) => b.id));

  // Удаляем из локальных те, что уже есть в API
  const stillLocal = readCreatedBookings().filter((b) => !apiIds.has(b.id));

  return [...apiBookings, ...stillLocal];
}
