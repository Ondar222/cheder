/**
 * Серверный склад заявок с сайта.
 *
 * Заявку отправляет гость со своего устройства, а смотрит её менеджер со
 * своего — localStorage для этой задачи не годится (он привязан к браузеру).
 * Поэтому склад лежит на сервере сайта в JSON-файле data/leads.json: запись
 * идёт через POST /api/leads, чтение — через GET /api/leads.
 *
 * Файл, а не база: заявок у санатория десятки в день, файловый склад не требует
 * ни СУБД, ни настройки коннекта, его можно забэкапить копированием. Записи
 * сериализуются промис-очередью, чтобы параллельные заявки не затёрли друг
 * друга. Файл содержит персональные данные (ФИО, телефон) и в git не попадает.
 */

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export type LeadStatus = 'new' | 'in_work' | 'booked' | 'declined';

/** Заявка в том же составе, что и на клиенте (lib/leads.ts) */
export type StoredLead = {
  leadId: string;
  status: LeadStatus;
  /** Бронь Yurta, созданная по заявке; нет — бронь не удалось поставить */
  bookingId?: number;
  /** Причина, по которой бронь не создалась: заявка при этом сохранена */
  bookingError?: string;
  submittedAt: string;
  [key: string]: unknown;
};

/** Сколько заявок храним: суточный поток у санатория небольшой, хвост отрезаем */
const MAX_LEADS = 500;

const DATA_DIR = path.join(process.cwd(), 'data');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');

/**
 * Очередь записей. Две одновременные заявки прочитали бы файл, каждая добавила
 * бы свою запись и вторая перезаписала бы первую — поэтому запись всегда идёт
 * строго после предыдущей.
 */
let writeQueue: Promise<void> = Promise.resolve();

async function readLeadsFile(): Promise<StoredLead[]> {
  try {
    const raw = await readFile(LEADS_FILE, 'utf8');
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as StoredLead[]) : [];
  } catch (error) {
    // Файла ещё нет (первая заявка после установки) — это не ошибка
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
    // Повреждённый файл не должен ронять приём заявок вечно: читаем пустой список,
    // оригинал остаётся на диске для разбора
    console.error('[leads-store] не удалось прочитать leads.json:', error);
    return [];
  }
}

async function writeLeadsFile(leads: StoredLead[]): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  // Записываем атомарно относительно читателя: JSON одной строкой, с переводом
  await writeFile(LEADS_FILE, `${JSON.stringify(leads, null, 2)}\n`, 'utf8');
}

/** Читает все заявки (новые в начале — так их и кладём) */
export function listLeads(): Promise<StoredLead[]> {
  return readLeadsFile();
}

/**
 * Применяет изменение к складу строго по очереди: updater получает текущий
 * список и возвращает новый. Возвращает то, что вернул updater, — вызывающему
 * нужен результат (добавленная заявка, например), а не просто факт записи.
 */
export async function mutateLeads<T>(updater: (leads: StoredLead[]) => { next: StoredLead[]; result: T }): Promise<T> {
  const run = writeQueue.then(async () => {
    const current = await readLeadsFile();
    const { next, result } = updater(current);
    await writeLeadsFile(next.slice(0, MAX_LEADS));
    return result;
  });

  // Очередь не должна рваться из-за одной упавшей записи
  writeQueue = run.then(
    () => undefined,
    () => undefined,
  );

  return run;
}

/** Новая заявка — в начало склада */
export function appendLead(lead: StoredLead): Promise<StoredLead> {
  return mutateLeads((leads) => ({ next: [lead, ...leads], result: lead }));
}

export function findLead(leadId: string): Promise<StoredLead | null> {
  return listLeads().then((leads) => leads.find((lead) => lead.leadId === leadId) ?? null);
}
