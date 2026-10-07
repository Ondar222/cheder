/**
 * Заявки с сайта.
 *
 * Гость отправляет форму у себя, менеджер смотрит список в кабинете — поэтому
 * основной склад лежит на сервере (app/api/leads/route.ts → data/leads.json).
 * Там же заявка превращается в бронь Yurta: сервер под сервисным аккаунтом
 * отеля создаёт заезд, и он сразу виден в шахматке раздела «Брони».
 *
 * localStorage остаётся резервной копией: если приёмник недоступен (статическая
 * выкладка без сервера, сбой сети), заявка всё равно не теряется — она пишется
 * локально и видна в этом же браузере. Локальную копию держим и при успешной
 * отправке: список в кабинете открывается сразу, а соседняя вкладка узнаёт об
 * изменении по событию storage.
 *
 * Синхронные функции не бросают никогда: форма гостя не должна падать из-за
 * проблем склада — подтверждение брони важнее доставки заявки в таблицу.
 */

import type { BookingPayload } from '@/lib/booking';

export type LeadStatus = 'new' | 'in_work' | 'booked' | 'declined';

export type SiteLead = BookingPayload & {
  /** Стабильный id для списка и разметки статуса */
  leadId: string;
  status: LeadStatus;
  /** Бронь в Yurta, созданная из этой заявки */
  bookingId?: number;
  /** Почему бронь не создалась — заявка при этом сохранена */
  bookingError?: string;
  /** Телефон в E.164 (+7913...) — его даёт сервер, для ссылки tel: он надёжнее */
  phoneE164?: string;
};

const STORAGE_KEY = 'cheder_site_leads';
const MAX_LEADS = 200;

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  new: 'Новая',
  in_work: 'В работе',
  booked: 'В броне',
  declined: 'Отказ',
};

function storage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Локальная копия: резервный склад и кэш последнего серверного списка */
export function readLeads(): SiteLead[] {
  const raw = storage()?.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as SiteLead[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLeads(leads: SiteLead[]): void {
  try {
    storage()?.setItem(STORAGE_KEY, JSON.stringify(leads.slice(0, MAX_LEADS)));
  } catch {
    // Переполнение хранилища не должно ломать отправку формы гостем
  }
}

/** Кладёт заявку в начало локального списка, если её там ещё нет */
function cacheLead(lead: SiteLead): void {
  writeLeads([lead, ...readLeads().filter((item) => item.leadId !== lead.leadId)]);
}

function patchCachedLead(
  leadId: string,
  patch: Partial<Pick<SiteLead, 'status' | 'bookingId' | 'bookingError'>>,
): void {
  writeLeads(readLeads().map((lead) => (lead.leadId === leadId ? { ...lead, ...patch } : lead)));
}

function dropCachedLead(leadId: string): void {
  writeLeads(readLeads().filter((lead) => lead.leadId !== leadId));
}

/**
 * Новая заявка только локально — резерв на случай, когда сервер её не принял.
 * Экспортируется: им пользуется submitBooking как последний путь.
 */
export function addLead(payload: BookingPayload): SiteLead {
  const lead: SiteLead = {
    ...payload,
    leadId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    status: 'new',
  };
  cacheLead(lead);
  return lead;
}

/** Синхронные варианты — работа с локальной копией (кабинет офлайн, старые данные) */
export function updateLead(
  leadId: string,
  patch: Partial<Pick<SiteLead, 'status' | 'bookingId' | 'bookingError'>>,
): void {
  patchCachedLead(leadId, patch);
}

export function removeLead(leadId: string): void {
  dropCachedLead(leadId);
}

/** Счётчик новых заявок для шеврона в шапке кабинета (по локальной копии) */
export function countNewLeads(): number {
  return readLeads().filter((lead) => lead.status === 'new').length;
}

/* ------------------------------------------------------------------ *
 * Серверный склад
 * ------------------------------------------------------------------ */

type Envelope<T> = { ok?: boolean; message?: string } & T;

/**
 * Запрос к своему же приёмнику. Путь относительный — чтобы работало и на
 * localhost, и на боевом домене без отдельной переменной окружения.
 */
async function leadsRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    // Список заявок обязан быть свежим
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });

  let payload: Envelope<T> | null = null;
  try {
    payload = (await response.json()) as Envelope<T>;
  } catch {
    payload = null;
  }

  if (!response.ok || payload?.ok === false) {
    throw new Error(payload?.message ?? `Приёмник заявок ответил ${response.status}`);
  }

  return (payload ?? ({} as Envelope<T>)) as T;
}

export type PushResult = {
  lead: SiteLead;
  /** Ушла ли заявка на сервер; false — лежит локально в браузере гостя */
  onServer: boolean;
};

/**
 * Отправка заявки гостем. Ошибка склада не считается ошибкой формы: заявку
 * кладём локально и возвращаем её же — гость увидит подтверждение, а менеджер
 * достанет её из резерва.
 */
export async function pushLead(payload: BookingPayload): Promise<PushResult> {
  try {
    const { lead } = await leadsRequest<{ lead: SiteLead }>('/api/leads', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    cacheLead(lead);
    return { lead, onServer: true };
  } catch (error) {
    console.warn('[leads] приёмник недоступен, заявка сохранена локально:', error);
    return { lead: addLead(payload), onServer: false };
  }
}

export type LeadsList = { leads: SiteLead[]; onServer: boolean; message?: string };

/**
 * Список заявок для кабинета. Сервер недоступен — отдаём локальную копию и
 * сообщаем причину, чтобы интерфейс честно пометил «показано из локального
 * резерва», а не выдавал устаревший список за боевой.
 */
export async function fetchLeads(): Promise<LeadsList> {
  try {
    const { leads } = await leadsRequest<{ leads: SiteLead[] }>('/api/leads');
    const list = Array.isArray(leads) ? leads : [];
    writeLeads(list);
    return { leads: list, onServer: true };
  } catch (error) {
    return {
      leads: readLeads(),
      onServer: false,
      message: error instanceof Error ? error.message : 'Приёмник заявок недоступен',
    };
  }
}

/** Меняет статус/бронь на сервере и в локальной копии. false — если сервер отказал */
export async function patchLead(
  leadId: string,
  patch: Partial<Pick<SiteLead, 'status' | 'bookingId'>>,
): Promise<boolean> {
  patchCachedLead(leadId, patch);
  try {
    await leadsRequest<{ lead: SiteLead }>('/api/leads', {
      method: 'PATCH',
      body: JSON.stringify({ leadId, ...patch }),
    });
    return true;
  } catch (error) {
    console.warn('[leads] статус обновлён только локально:', error);
    return false;
  }
}

export async function deleteLead(leadId: string): Promise<boolean> {
  dropCachedLead(leadId);
  try {
    await leadsRequest<Record<string, never>>(`/api/leads?leadId=${encodeURIComponent(leadId)}`, {
      method: 'DELETE',
    });
    return true;
  } catch (error) {
    console.warn('[leads] заявка удалена только локально:', error);
    return false;
  }
}