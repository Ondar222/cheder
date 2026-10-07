/**
 * Серверный клиент API Yurta для броней с сайта.
 *
 * Гость бронирует со своего устройства, где сессии менеджера нет, поэтому
 * бронь создаёт сервер сайта под сервисным аккаунтом отеля. Токен живёт в
 * памяти процесса и обновляется по истечении: логин стоит одного запроса, а
 * держать его на каждую заявку гостя незачем.
 *
 * Переменные окружения:
 *   YURTA_API_BASE     — база API (по умолчанию NEXT_PUBLIC_YURTA_API, затем test-api)
 *   YURTA_API_EMAIL    — логин сервисного аккаунта отеля
 *   YURTA_API_PASSWORD — пароль сервисного аккаунта
 *
 * Без логина и пароля модуль не бросает ошибку на импорте: сайт продолжает
 * принимать заявки, а причина «нет доступа к API» видна в логах и в ответе
 * /api/leads. Так лендинг не падает из-за невыданных учёток.
 */

import { normalizeGrid, type BookingGrid, type GridPeriod } from '@/lib/bookingGrid';
import { bookingRequestBody, createdBookingId, type CreateBookingDto } from '@/lib/bookingApi';

/** Конверт ответа Yurta: полезная нагрузка в data, причина отказа — в message */
type Envelope<T> = { status?: number; message?: string; errors?: string[]; data?: T };

type AuthTokens = {
  access_token?: string;
  refresh_token?: string;
  expires?: number;
};

/** База API: явная переменная сервера важнее публичной, у той же дефолт на тест */
export function yurtaBase(): string {
  const raw =
    process.env.YURTA_API_BASE ??
    process.env.NEXT_PUBLIC_YURTA_API ??
    'https://test-api.yurta.site';
  return raw.replace(/\/+$/, '');
}

/** Висящий коннект к Yurta не должен держать запрос гостя вечно */
const REQUEST_TIMEOUT_MS = 10_000;

/** Токен обновляем заранее, чтобы не ловить 401 на середине брони */
const TOKEN_SAFETY_MS = 60_000;

export class YurtaError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'YurtaError';
    this.status = status;
  }
}

export function yurtaConfigured(): boolean {
  return Boolean(process.env.YURTA_API_EMAIL && process.env.YURTA_API_PASSWORD);
}

type CachedToken = { value: string; expiresAt: number };

let tokenCache: CachedToken | null = null;
let loginInFlight: Promise<string> | null = null;

async function parseEnvelope<T>(response: Response): Promise<Envelope<T> | null> {
  const text = await response.text().catch(() => '');
  if (!text) return null;
  try {
    return JSON.parse(text) as Envelope<T>;
  } catch {
    return null;
  }
}

/** Логин сервисного аккаунта; одновременные заявки делят один запрос входа */
function login(): Promise<string> {
  if (loginInFlight) return loginInFlight;

  loginInFlight = (async () => {
    const email = process.env.YURTA_API_EMAIL;
    const password = process.env.YURTA_API_PASSWORD;
    if (!email || !password) {
      throw new YurtaError(0, 'Не заданы YURTA_API_EMAIL и YURTA_API_PASSWORD');
    }

    let response: Response;
    try {
      response = await fetch(`${yurtaBase()}/auth/login/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        cache: 'no-store',
      });
    } catch {
      throw new YurtaError(0, 'Сервис бронирования недоступен');
    }

    const payload = await parseEnvelope<AuthTokens>(response);
    const token = payload?.data?.access_token;
    if (!response.ok || !token) {
      throw new YurtaError(response.status, payload?.message ?? 'Не удалось войти в API бронирования');
    }

    // expires — unix-ms; если сервер его не дал, считаем токен условно живым час
    const expiresAt = payload?.data?.expires ?? Date.now() + 60 * 60 * 1000;
    tokenCache = { value: token, expiresAt };
    return token;
  })().finally(() => {
    loginInFlight = null;
  });

  return loginInFlight;
}

async function accessToken(): Promise<string> {
  if (tokenCache && tokenCache.expiresAt - TOKEN_SAFETY_MS > Date.now()) return tokenCache.value;
  return login();
}

async function rawRequest<T>(
  path: string,
  options: { method?: string; body?: unknown; token: string },
): Promise<{ ok: boolean; status: number; payload: Envelope<T> | null }> {
  let response: Response;
  try {
    response = await fetch(`${yurtaBase()}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        Authorization: `Bearer ${options.token}`,
        ...(options.body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      cache: 'no-store',
    });
  } catch {
    throw new YurtaError(0, 'Сервис бронирования недоступен');
  }

  return { ok: response.ok, status: response.status, payload: await parseEnvelope<T>(response) };
}

/** Запрос под сервисным токеном: на 401 логинимся заново и повторяем один раз */
async function serverRequest<T>(
  path: string,
  options: { method?: string; body?: unknown } = {},
  retried = false,
): Promise<T | undefined> {
  const token = await accessToken();
  const { ok, status, payload } = await rawRequest<T>(path, { ...options, token });

  if (!ok) {
    if (status === 401 && !retried) {
      tokenCache = null;
      return serverRequest<T>(path, options, true);
    }
    throw new YurtaError(status, payload?.message ?? `API бронирования ответил ${status}`);
  }

  return payload?.data;
}

/** Комнаты и брони отеля за период — под сервисным аккаунтом */
export async function fetchServerGrid(period: GridPeriod): Promise<BookingGrid> {
  const query = new URLSearchParams({
    check_in: String(period.checkIn),
    check_out: String(period.checkOut),
  });
  const data = await serverRequest<{ rooms?: unknown[]; bookings?: unknown[] }>(
    `/v4/booking/grid?${query.toString()}`,
  );
  return normalizeGrid(data);
}

/** Создание брони под сервисным аккаунтом. Возвращает id брони из ответа API */
export async function createServerBooking(dto: CreateBookingDto): Promise<number | undefined> {
  const data = await serverRequest<{ id?: number; data?: { id?: number } }>(
    '/v2/booking/room/prepaid',
    { method: 'POST', body: bookingRequestBody(dto) },
  );
  return createdBookingId(data);
}
