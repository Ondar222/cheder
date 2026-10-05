/**
 * Вход менеджера под аккаунтом партнёра Yurta — те же учётки, что в
 * partners-next. Отдельной регистрации в админке нет: доступ к броням санатория
 * даёт роль аккаунта на стороне API.
 *
 * Токены кладём в localStorage (как в partners-next), поэтому админка — чистый
 * клиент: ни cookie, ни middleware, ни своего сервера.
 */

'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { publicRequest } from '@/lib/api';
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

/** Ответ /auth/login/password и /auth/refresh */
type AuthResponse = {
  access_token?: string;
  expires?: number;
  refresh_token?: string;
  refresh_token_expires?: number;
  user?: SessionUser;
};

export async function login(email: string, password: string): Promise<LoginResult> {
  try {
    const { data } = await publicRequest<AuthResponse>('/auth/login/password', {
      method: 'POST',
      body: { email: email.trim(), password },
    });
    saveSession(data);
    return { ok: true, user: getSessionUser() };
  } catch (error) {
    const message =
      error && typeof error === 'object' && 'message' in error
        ? String((error as { message: unknown }).message)
        : 'Не удалось войти';
    return { ok: false, message };
  }
}

export function logout(): void {
  clearSession();
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
