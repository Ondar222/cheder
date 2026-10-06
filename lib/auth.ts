/**
 * Вход менеджера под аккаунтом партнёра Yurta — те же учётки, что в
 * partners-next. Отдельной регистрации в админке нет: доступ к броням санатория
 * даёт роль аккаунта на стороне API.
 *
 * Токены кладём в localStorage (как в partners-next), но сам логин делает сервер
 * сайта (/api/admin/session): только так он может выдать httpOnly-cookie сессии,
 * по которой кабинет забирает заявки гостей. Без неё список заявок был бы доступен
 * любому, кто знает адрес приёмника, а в заявке — ФИО и телефон человека.
 */

'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import {
  clearSession,
  getServerSessionSnapshot,
  getSessionSnapshot,
  getSessionUser,
  roleOf,
  saveSession,
  subscribeSession,
  SNAPSHOT_SERVER,
  type SessionUser,
} from '@/lib/session';

export type { SessionUser };

export type LoginResult = { ok: true; user: SessionUser | null } | { ok: false; message: string };

/** Ответ /api/admin/session: data — токены, их же возвращает /auth/login/password */
type AuthResponse = {
  access_token?: string;
  expires?: number;
  refresh_token?: string;
  refresh_token_expires?: number;
  user?: SessionUser;
};

export async function login(email: string, password: string): Promise<LoginResult> {
  try {
    const response = await fetch('/api/admin/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password }),
      cache: 'no-store',
    });

    const payload = (await response.json().catch(() => null)) as
      | { ok?: boolean; message?: string; data?: AuthResponse }
      | null;

    if (!response.ok || !payload?.data) {
      return { ok: false, message: payload?.message ?? 'Не удалось войти' };
    }

    saveSession(payload.data);
    return { ok: true, user: getSessionUser() };
  } catch {
    return { ok: false, message: 'Нет связи с сервером, попробуйте позднее' };
  }
}

export function logout(): void {
  clearSession();
  // Сессионную cookie может снять только сервер; сама она не видна скриптам
  void fetch('/api/admin/session', { method: 'DELETE' }).catch(() => undefined);
}

export type AdminAuthState = {
  /** localStorage прочитан — можно рисовать содержимое, иначе hydration разъедется */
  ready: boolean;
  authed: boolean;
  user: SessionUser | null;
  role: string;
  logout: () => void;
};

/**
 * Состояние входа для клиентских страниц админки.
 *
 * localStorage читаем через useSyncExternalStore: React сам сверяет снимок после
 * гидрации, поэтому серверный рендер и первый клиентский рендер одинаковы
 * (ready=false, показываем спиннер), а вход/выход перерисовывают кабинет сразу.
 * Событие storage синхронитирует выход, если менеджер закрыл сессию в другой
 * вкладке.
 */
export function useAdminAuth(): AdminAuthState {
  const token = useSyncExternalStore(subscribeSession, getSessionSnapshot, getServerSessionSnapshot);
  const ready = token !== SNAPSHOT_SERVER;
  const user = useMemo(() => (token ? getSessionUser() : null), [token]);

  const handleLogout = useCallback(() => logout(), []);

  return { ready, authed: Boolean(token), user, role: roleOf(user), logout: handleLogout };
}
