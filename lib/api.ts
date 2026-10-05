/**
 * HTTP-клиент к API платформы Yurta (та же, что у partners-next).
 *
 * Своего бэкенда у сайта нет, поэтому админка говорит с API напрямую из
 * браузера: сервер отдаёт Access-Control-Allow-Origin: * и разрешает заголовок
 * authorization в preflight, так что axios и serverless-прослойка не нужны.
 *
 * Ответ всегда в конверте { status, message, data } (см. ApiResponse в
 * partners-next), доступ по Bearer-токену, на 401 токен один раз обновляется
 * через /auth/refresh и запрос повторяется. axios в сайт не тянем: нативного
 * fetch хватает, лишней зависимости в лэндинге меньше.
 */

import {
  clearSession,
  getAccessToken,
  getRefreshToken,
  saveSession,
  type SessionTokens,
} from '@/lib/session';

const rawBase = process.env.NEXT_PUBLIC_YURTA_API ?? 'https://api.yurta.site';

/** Не «https://host/» + «/auth»: нормализуем слэш на границе */
export const API_BASE = rawBase.replace(/\/+$/, '');

/** Полезная нагрузка лежит в data; поля конверта дублируем в ошибку для отладки */
export type ApiEnvelope<T> = {
  status?: number;
  message?: string;
  errors?: string[];
  data: T;
};

export class ApiError extends Error {
  readonly status: number;
  readonly details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

/** Человекочитаемая причина для message.error() в формах */
export function describeApiError(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.status === 403) return 'Сессия истекла, войдите заново';
    if (error.status === 0) return 'Сервис недоступен, попробуйте позднее';
    return error.message || `Ошибка запроса (${error.status})`;
  }
  if (error instanceof TypeError) return 'Нет связи с сервером, проверьте интернет';
  return error instanceof Error ? error.message : 'Неизвестная ошибка';
}

type Query = Record<string, string | number | undefined>;

function withQuery(path: string, query?: Query): string {
  if (!query) return path;
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `${path}?${qs}` : path;
}

async function rawRequest<T>(
  path: string,
  {
    method = 'GET',
    body,
    query,
    token,
  }: { method?: string; body?: unknown; query?: Query; token?: string | null },
): Promise<ApiEnvelope<T>> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${withQuery(path, query)}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    // Браузер не смог достучаться (нет сети / DNS / CORS для чужого хоста)
    throw new ApiError(0, 'Нет связи с сервером');
  }

  // Пустое тело (204 и «голый» OK) — парсить нечего, но это успех
  const text = await response.text().catch(() => '');
  let payload: ApiEnvelope<T> | null = null;
  if (text) {
    try {
      payload = JSON.parse(text) as ApiEnvelope<T>;
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const message =
      payload?.message ??
      (response.status === 401 || response.status === 403
        ? 'Неверный логин или пароль'
        : `Ошибка запроса (${response.status})`);
    throw new ApiError(response.status, message, payload ?? text);
  }

  return payload ?? ({ data: text as T });
}

/**
 * Обновление токенов. Одновременные 401 от нескольких запросов должны дать
 * один refresh, иначе гонка меняет refresh_token и следующая попытка падает.
 */
let refreshInFlight: Promise<boolean> | null = null;

export function refreshSession(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const refresh = getRefreshToken();
    if (!refresh) return false;
    try {
      const { data } = await rawRequest<SessionTokens>('/auth/refresh', {
        method: 'POST',
        body: { refresh },
      });
      saveSession(data);
      return Boolean(getAccessToken());
    } catch {
      // Обновиться не удалось — сессия невалидна, дальше только повторный вход
      clearSession();
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

/** Запрос с авторизацией и повтором после refresh на 401 */
export async function apiRequest<T>(
  path: string,
  options: { method?: string; body?: unknown; query?: Query } = {},
): Promise<T> {
  const envelope = await attemptWithRefresh<T>(path, options);
  return envelope.data;
}

async function attemptWithRefresh<T>(
  path: string,
  options: { method?: string; body?: unknown; query?: Query },
  retried = false,
): Promise<ApiEnvelope<T>> {
  try {
    return await rawRequest<T>(path, { ...options, token: getAccessToken() });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401 && !retried) {
      const refreshed = await refreshSession();
      if (refreshed) return attemptWithRefresh<T>(path, options, true);
    }
    throw error;
  }
}

/** Публичный запрос без токена: вход, код из письма */
export function publicRequest<T>(
  path: string,
  options: { method?: string; body?: unknown; query?: Query } = {},
): Promise<ApiEnvelope<T>> {
  return rawRequest<T>(path, { ...options, token: null });
}
