/**
 * Заявки с сайта.
 *
 * Своего бэкенда нет, а в API Yurta сущности «заявка» не существует — там сразу
 * бронь. Поэтому заявка из формы бронирования кладётся в localStorage браузера:
 * менеджер в админке видит её, звонит гостю и переводит в бронь (создаёт её
 * через /v2/booking/room/prepaid). Если задан NEXT_PUBLIC_BOOKING_WEBHOOK,
 * заявка параллельно уходит на webhook — админка его не заменяет.
 *
 * Ограничение честное: localStorage привязан к браузеру. Гость отправляет
 * форму у себя, и заявка появляется в админке только там, где открыт этот же
 * браузер. Для реального потока заявок нужен приёмник (webhook/CRM) — код к
 * этому готов, приёмник подключается переменной окружения.
 */

import type { BookingPayload } from '@/lib/booking';

export type LeadStatus = 'new' | 'in_work' | 'booked' | 'declined';

export type SiteLead = BookingPayload & {
  /** Стабильный id для списка и разметки статуса */
  leadId: string;
  status: LeadStatus;
  /** Бронь в Yurta, созданная из этой заявки */
  bookingId?: number;
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

/** Новая заявка — в начало списка; хвост отрезается, чтобы не раздувать storage */
export function addLead(payload: BookingPayload): SiteLead {
  const lead: SiteLead = {
    ...payload,
    leadId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    status: 'new',
  };
  writeLeads([lead, ...readLeads()]);
  return lead;
}

export function updateLead(leadId: string, patch: Partial<Pick<SiteLead, 'status' | 'bookingId'>>): void {
  writeLeads(readLeads().map((lead) => (lead.leadId === leadId ? { ...lead, ...patch } : lead)));
}

export function removeLead(leadId: string): void {
  writeLeads(readLeads().filter((lead) => lead.leadId !== leadId));
}

export function countNewLeads(): number {
  return readLeads().filter((lead) => lead.status === 'new').length;
}
