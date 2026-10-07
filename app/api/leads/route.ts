/**
 * Приёмник заявок с сайта.
 *
 * Гость отправляет форму со своего устройства, менеджер смотрит заявки со
 * своего — нужен общий склад на сервере (lib/server/leads-store.ts). Пока
 * приёмника не было, заявка жила в localStorage браузера гостя и до кабинета не
 * доходила.
 *
 * Тут же заявка превращается в бронь Yurta (lib/server/booking-from-lead.ts):
 * сервер под сервисным аккаунтом отеля подбирает свободный номер и создаёт
 * заезд, поэтому бронь с сайта сразу видна в шахматке. Ошибка брони не отменяет
 * заявку — она сохраняется с bookingError, чтобы менеджер дозвонился вручную.
 *
 * Права разведены по-честному:
 *   POST   — открыт: форму заполняет гость, аккаунта у него нет. Взамен жёсткая
 *            проверка и пересчёт суммы на сервере плюс ограничение частоты.
 *   GET/PATCH/DELETE — только по сессии кабинета (httpOnly-cookie из
 *            /api/admin/session): в заявке ФИО, телефон и паспорт гостя, отдавать
 *            их любому нельзя.
 */

import { NextResponse } from 'next/server';
import {
  appendLead,
  listLeads,
  mutateLeads,
  type LeadStatus,
  type StoredLead,
} from '@/lib/server/leads-store';
import { parseLeadPayload } from '@/lib/server/lead-payload';
import { createBookingFromLead } from '@/lib/server/booking-from-lead';
import { sessionFromRequest } from '@/lib/server/admin-session';

/**
 * Заявку может прислать кто угодно, поэтому с одного адреса принимаем не больше
 * нескольких в минуту. Счётчик в памяти процесса: для одного сервера этого
 * достаточно, при нескольких инстансах он лишь грубо режет спам — не бизнес-правило,
 * а защита от случайного «зажать Enter».
 */
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 8;
const hits = new Map<string, number[]>();

function tooManyHits(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((at) => now - at < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_MAX) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);

  // Карта не должна расти бесконечно: чистим, когда накопилось много ключей
  if (hits.size > 5000) {
    for (const [key, times] of hits) {
      if (!times.some((at) => now - at < RATE_LIMIT_WINDOW_MS)) hits.delete(key);
    }
  }
  return false;
}

/** Реальный адрес гостя: за nginx остаётся только X-Forwarded-For */
function clientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}

const STATUSES: LeadStatus[] = ['new', 'in_work', 'booked', 'declined'];

export async function POST(request: Request) {
  if (tooManyHits(clientIp(request))) {
    return NextResponse.json(
      { ok: false, message: 'Слишком много заявок подряд, подождите минуту' },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: 'Тело заявки должно быть JSON' }, { status: 400 });
  }

  const parsed = parseLeadPayload(body);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, message: parsed.message }, { status: 400 });
  }

  // Идентификатор присваиваем на сервере: гость не должен выбирать его сам
  parsed.lead.leadId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  // Бронь ставим до сохранения: её id и причина отказа — часть самой заявки.
  // Сбой API отеля не должен ронять приём заявок — гость уже видел подтверждение.
  const attempt = await createBookingFromLead(parsed.lead);
  if (attempt.ok) {
    parsed.lead.status = 'booked';
    if (attempt.bookingId !== undefined) parsed.lead.bookingId = attempt.bookingId;
  } else {
    parsed.lead.bookingError = attempt.message;
  }

  try {
    const saved = await appendLead(parsed.lead);
    return NextResponse.json({ ok: true, lead: saved }, { status: 201 });
  } catch (error) {
    console.error('[api/leads] не удалось сохранить заявку:', error);
    return NextResponse.json({ ok: false, message: 'Заявку не удалось сохранить, попробуйте позднее' }, { status: 500 });
  }
}

export async function GET(request: Request) {
  if (!(await sessionFromRequest(request))) {
    return NextResponse.json({ ok: false, message: 'Нужен вход в кабинет менеджера' }, { status: 401 });
  }

  try {
    const leads = await listLeads();
    return NextResponse.json({ ok: true, leads });
  } catch (error) {
    console.error('[api/leads] не удалось прочитать склад:', error);
    return NextResponse.json({ ok: false, message: 'Склад заявок недоступен' }, { status: 500 });
  }
}

/** Менеджер меняет статус и привязывает созданную бронь Yurta */
export async function PATCH(request: Request) {
  if (!(await sessionFromRequest(request))) {
    return NextResponse.json({ ok: false, message: 'Нужен вход в кабинет менеджера' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: 'Ожидались leadId и изменения' }, { status: 400 });
  }

  const { leadId, status, bookingId } = (body ?? {}) as {
    leadId?: unknown;
    status?: unknown;
    bookingId?: unknown;
  };

  if (typeof leadId !== 'string' || !leadId) {
    return NextResponse.json({ ok: false, message: 'Не указан номер заявки' }, { status: 400 });
  }
  if (status !== undefined && !STATUSES.includes(status as LeadStatus)) {
    return NextResponse.json({ ok: false, message: 'Неизвестный статус заявки' }, { status: 400 });
  }
  if (bookingId !== undefined && !Number.isFinite(Number(bookingId))) {
    return NextResponse.json({ ok: false, message: 'Номер брони должен быть числом' }, { status: 400 });
  }

  const patch: Partial<Pick<StoredLead, 'status' | 'bookingId' | 'bookingError'>> = {};
  if (status !== undefined) patch.status = status as LeadStatus;
  if (bookingId !== undefined) {
    patch.bookingId = Number(bookingId);
    // Менеджер привязал бронь вручную — прежняя причина отказа больше не актуальна
    patch.bookingError = undefined;
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ ok: false, message: 'Нечего менять в заявке' }, { status: 400 });
  }

  const result = await mutateLeads((leads) => {
    const target = leads.find((lead) => lead.leadId === leadId);
    if (!target) return { next: leads, result: null };
    return {
      next: leads.map((lead) => (lead.leadId === leadId ? { ...lead, ...patch } : lead)),
      result: { ...target, ...patch },
    };
  });

  if (!result) return NextResponse.json({ ok: false, message: 'Заявка не найдена' }, { status: 404 });
  return NextResponse.json({ ok: true, lead: result });
}

export async function DELETE(request: Request) {
  if (!(await sessionFromRequest(request))) {
    return NextResponse.json({ ok: false, message: 'Нужен вход в кабинет менеджера' }, { status: 401 });
  }

  const leadId = new URL(request.url).searchParams.get('leadId');
  if (!leadId) return NextResponse.json({ ok: false, message: 'Не указан номер заявки' }, { status: 400 });

  const removed = await mutateLeads((leads) => {
    const next = leads.filter((lead) => lead.leadId !== leadId);
    return { next, result: next.length !== leads.length };
  });

  if (!removed) return NextResponse.json({ ok: false, message: 'Заявка не найдена' }, { status: 404 });
  return NextResponse.json({ ok: true });
}
