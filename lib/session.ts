/**
 * Хранилище сессии админки в localStorage.
 *
 * Ключи те же, что у partners-next (access_token / refresh_token / expires /
 * user), поэтому токен, полученный в одном месте, читается в другом, а код
 * разлогина и обновления остаётся одинаковым во всех кабинетах платформы.
 *
 * Отдельный модуль нужен, чтобы api.ts и auth.ts не ссылались друг на друга:
 * и те, и другие читают токены только отсюда.
 */

export type UserRole = { id: string } | string | null | undefined;

export type SessionUser = {
  id?: string;
  name?: string;
  surname?: string;
  phone?: string;
  email?: string;
  role?: UserRole;
};

export type SessionTokens = {
  access_token?: string;
  refresh_token?: string;
  /** Unix-ms, до которых живёт access_token */
  expires?: number;
  refresh_token_expires?: number;
  user?: SessionUser;
};

const KEYS = {
  access: 'access_token',
  refresh: 'refresh_token',
  expires: 'expires',
  refreshExpires: 'refresh_token_expires',
  user: 'user',
} as const;

/** SSR и приватный режим Safari (бросает SecurityError на любом обращении) */
function storage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function read(key: string): string | null {
  return storage()?.getItem(key) ?? null;
}

function write(key: string, value: string): void {
  try {
    storage()?.setItem(key, value);
  } catch {
    // Переполнение/запрет хранилища не должно ронять админку
  }
}

function drop(key: string): void {
  try {
    storage()?.removeItem(key);
  } catch {
    /* игнорируем */
  }
}

export function getAccessToken(): string | null {
  return read(KEYS.access);
}

/**
 * Событие «сессия изменилась». Событие storage браузер присылает только другим
 * вкладкам, а админке нужно перерисоваться и после своего login/logout.
 */
const SESSION_EVENT = 'cheder:session';

function notifySession(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(SESSION_EVENT));
}

/**
 * Снимок для useSyncExternalStore: строка-примитив, чтобы React сравнивал
 * состояние по значению и не перерисовывался на каждом обращении к хранилищу.
 *
 * Маркеры нужны, чтобы отличать «localStorage ещё не читали» (сервер и первая
 * гидрация — иначе разметка разошлась бы) от «прочитали, сессии нет».
 */
export const SNAPSHOT_SERVER = '\u0000server';
export const SNAPSHOT_NONE = '';

export function getSessionSnapshot(): string {
  return getAccessToken() ?? read(KEYS.refresh) ?? SNAPSHOT_NONE;
}

/** Значение снимка до hydration: на сервере хранилища нет */
export function getServerSessionSnapshot(): string {
  return SNAPSHOT_SERVER;
}

/** Подписка на изменения сессии: своя вкладка (SESSION_EVENT) и соседние (storage) */
export function subscribeSession(onChange: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', onChange);
  window.addEventListener(SESSION_EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(SESSION_EVENT, onChange);
  };
}

export function getRefreshToken(): string | null {
  return read(KEYS.refresh);
}

/** Unix-ms, когда протух access_token; null — дата неизвестна */
export function getExpiresAt(): number | null {
  const raw = read(KEYS.expires);
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export function getSessionUser(): SessionUser | null {
  const raw = read(KEYS.user);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

/**
 * Ответ /auth/login/password и /auth/refresh приходит в разном составе: refresh
 * иногда отдаёт пользователя без роли. Слепая перезапись стирала роль, и кабинет
 * открывался «дефолтный» — поэтому поля дополняем, а не заменяем.
 */
export function saveSession(tokens: SessionTokens): void {
  if (tokens.access_token) write(KEYS.access, tokens.access_token);
  if (tokens.refresh_token) write(KEYS.refresh, tokens.refresh_token);

  const expires = tokens.expires ?? (tokens.access_token ? undefined : getExpiresAt());
  if (expires) write(KEYS.expires, String(expires));

  const refreshExpires = tokens.refresh_token_expires;
  if (refreshExpires) write(KEYS.refreshExpires, String(refreshExpires));

  if (tokens.user) {
    const prev = getSessionUser();
    const sameAccount = prev?.id && tokens.user.id && prev.id === tokens.user.id;
    const merged: SessionUser = sameAccount
      ? { ...prev, ...Object.fromEntries(Object.entries(tokens.user).filter(([, v]) => v !== undefined)) }
      : tokens.user;
    write(KEYS.user, JSON.stringify(merged));
  }

  notifySession();
}

export function clearSession(): void {
  drop(KEYS.access);
  drop(KEYS.refresh);
  drop(KEYS.expires);
  drop(KEYS.refreshExpires);
  drop(KEYS.user);
  notifySession();
}

/** Роль пользователя текстом: role приходит объектом { id } или строкой */
export function roleOf(user: SessionUser | null): string {
  if (!user?.role) return '';
  return typeof user.role === 'string' ? user.role : (user.role.id ?? '');
}
