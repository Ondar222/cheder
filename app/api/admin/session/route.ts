/**
 * Вход кабинета менеджера на сервере сайта.
 *
 * Менеджер входит под аккаунтом Yurta, и сам запрос логина умеет делать прямо из
 * браузера (API отдаёт CORS: *). Прокси нужен не для перестраховки, а для cookie:
 * только сервер может выдать httpOnly-сессию, по которой потом отдаются заявки
 * гостей. Браузер такую сессию подделать не может, а чужому домену не отправит.
 *
 * Ответ Yurta (токены) возвращается клиенту без изменений — lib/auth.ts кладёт их
 * в localStorage ровно так же, как кладёт после прямого входа в partners-next.
 */

import { NextResponse } from 'next/server';
import {
  SESSION_COOKIE,
  createSessionToken,
  sessionCookieOptions,
} from '@/lib/server/admin-session';

/**
 * База API платформы. Читаем переменную здесь, а не импортом из lib/api.ts:
 * тот модуль — клиентский слой доступа, в бандл сервера он тянуться не должен.
 */
const API_BASE = (process.env.NEXT_PUBLIC_YURTA_API ?? 'https://api.yurta.site').replace(/\/+$/, '');

/** Разумный предел: висящий коннект к Yurta не должен держать наш запрос вечно */
const UPSTREAM_TIMEOUT_MS = 10_000;

/** Живёт столько же, сколько подпись сессии (см. SESSION_TTL_MS в admin-session) */
const COOKIE_MAX_AGE_SECONDS = 12 * 60 * 60;

type YurtaAuthEnvelope = {
  status?: number;
  message?: string;
  data?: unknown;
};

export async function POST(request: Request) {
  let email = '';
  let password = '';

  try {
    const body = (await request.json()) as { email?: unknown; password?: unknown };
    email = typeof body.email === 'string' ? body.email.trim() : '';
    password = typeof body.password === 'string' ? body.password : '';
  } catch {
    return NextResponse.json({ ok: false, message: 'Ожидались email и пароль' }, { status: 400 });
  }

  if (!email || !password) {
    return NextResponse.json({ ok: false, message: 'Ожидались email и пароль' }, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${API_BASE}/auth/login/password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json({ ok: false, message: 'Сервис бронирования недоступен, попробуйте позднее' }, { status: 502 });
  }

  const text = await upstream.text().catch(() => '');
  let payload: YurtaAuthEnvelope | null = null;
  if (text) {
    try {
      payload = JSON.parse(text) as YurtaAuthEnvelope;
    } catch {
      payload = null;
    }
  }

  if (!upstream.ok || !payload?.data) {
    return NextResponse.json(
      { ok: false, message: payload?.message ?? 'Неверный логин или пароль' },
      { status: upstream.status === 200 ? 401 : upstream.status },
    );
  }

  const token = await createSessionToken(email);
  const response = NextResponse.json({ ok: true, data: payload.data });
  response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions(COOKIE_MAX_AGE_SECONDS));
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  // maxAge 0 — браузер выбрасывает cookie сразу, «пустое значение» не надёжно
  response.cookies.set(SESSION_COOKIE, '', { ...sessionCookieOptions(0), maxAge: 0 });
  return response;
}
