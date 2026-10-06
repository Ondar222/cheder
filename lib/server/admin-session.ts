/**
 * Серверная сессия кабинета менеджера.
 *
 * Вход менеджер делает под аккаунтом Yurta (см. lib/auth.ts), но самого факта
 * входа в браузере для защиты данных мало: заявка содержит ФИО и телефон гостя,
 * поэтому отдавать список заявок умеет только проверенный сервер.
 *
 * Схема простая и без состояния: после успешного входа сервер выдаёт подпись
 * (email + срок жизни), подписанную HMAC-секретом сайта, и кладёт её в
 * httpOnly-cookie. Cookie не читается из скриптов и не уезжает в чужие домены,
 * а сервер на каждом запросе к заявкам всего лишь сверяет подпись.
 *
 * Секрет берётся из ADMIN_SESSION_SECRET; если он не задан, генерируется один
 * раз и кладётся в data/.session-secret, чтобы перезапуск сервера не выкидывал
 * менеджера из кабинета на середине смены.
 */

import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { chmod, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const SESSION_COOKIE = 'cheder_admin';

/** Сессия живёт одну смену; дальше — пароль заново */
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

const SECRET_FILE = path.join(process.cwd(), 'data', '.session-secret');

let secretCache: string | null = null;

async function getSessionSecret(): Promise<string> {
  if (secretCache) return secretCache;

  const fromEnv = process.env.ADMIN_SESSION_SECRET;
  if (fromEnv && fromEnv.length >= 16) {
    secretCache = fromEnv;
    return secretCache;
  }

  try {
    secretCache = (await readFile(SECRET_FILE, 'utf8')).trim() || null;
    if (secretCache) return secretCache;
  } catch {
    // Файла нет — сгенерируем ниже
  }

  const generated = randomBytes(32).toString('hex');
  try {
    await mkdir(path.dirname(SECRET_FILE), { recursive: true });
    await writeFile(SECRET_FILE, `${generated}\n`, { encoding: 'utf8', mode: 0o600 });
    await chmod(SECRET_FILE, 0o600);
  } catch (error) {
    // Диск только для чтения: живём на секретe процесса, сессии переживут только
    // эту работу сервера — зато вход не ломается совсем
    console.error('[admin-session] не удалось сохранить секрет, сессии действуют до перезапуска:', error);
  }
  secretCache = generated;
  return secretCache;
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

/**
 * Токен сессии: «основание.подпись». Основание — email и срок жизни, поэтому
 * в базе сессий нет нужды, а подделать подпись без секрета нельзя.
 */
export async function createSessionToken(email: string): Promise<string> {
  const secret = await getSessionSecret();
  const payload = Buffer.from(JSON.stringify({ email, exp: Date.now() + SESSION_TTL_MS })).toString('base64url');
  return `${payload}.${sign(payload, secret)}`;
}

function equal(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  // lengthEqual внутри timingSafeEqual бросает на разной длине — сравниваем сначала
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

/** Проверяет подпись и срок; null — сессии нет или она протухла */
export async function verifySessionToken(token: string | undefined): Promise<{ email: string } | null> {
  if (!token) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;

  const secret = await getSessionSecret();
  if (!equal(sign(payload, secret), signature)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as { email?: string; exp?: number };
    if (!parsed.email || !parsed.exp || parsed.exp < Date.now()) return null;
    return { email: parsed.email };
  } catch {
    return null;
  }
}

/** Читает и проверяет сессию из запроса route handler */
export async function sessionFromRequest(request: Request): Promise<{ email: string } | null> {
  const cookie = request.headers.get('cookie');
  if (!cookie) return null;

  for (const part of cookie.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name !== SESSION_COOKIE) continue;
    return verifySessionToken(decodeURIComponent(rest.join('=')));
  }
  return null;
}

export function sessionCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    // По https сессия обязана идти только по шифру
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: maxAgeSeconds,
  };
}
