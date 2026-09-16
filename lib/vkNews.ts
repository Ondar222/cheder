/**
 * Загрузка постов группы ВКонтакте «Здравница Чедер» (vk.com/z_cheder).
 *
 * Требуемые переменные окружения (файл .env):
 *  - VK_ACCESS_TOKEN — токен пользователя (права wall) или сообщества
 *  - VK_OWNER_ID     — id группы (-228264930) или её адрес (z_cheder)
 *
 * При отсутствии переменных, ошибке запроса или лимитах API возвращается пустой
 * массив — вызывающий код обязан иметь собственный фолбэк.
 */

export type VkPost = {
  id: string;
  url: string;
  /** Дата публикации в формате dd.mm.yyyy */
  date: string;
  title: string;
  excerpt: string;
  image?: string;
  photos: number;
  /** Пост — видеозапись (на обложке показываем кнопку воспроизведения) */
  video: boolean;
  likes: number;
  pinned: boolean;
};

const VK_API = 'https://api.vk.com/method';
const VK_API_VERSION = '5.199';
const REVALIDATE_SECONDS = 60 * 60; // обновляем ленту раз в час
const GROUP_TIMEZONE_OFFSET = 7 * 60 * 60; // UTC+7 (Кызыл/Красноярск)

type VkPhotoSize = { url?: string; width?: number; height?: number };

type VkAttachment = {
  type?: string;
  photo?: { sizes?: VkPhotoSize[]; text?: string };
  video?: {
    title?: string;
    photo?: VkPhotoSize[];
    image?: VkPhotoSize[];
    first_frame?: VkPhotoSize[];
  };
};

type VkWallItem = {
  id: number;
  date?: number;
  from_id?: number;
  text?: string;
  attachments?: VkAttachment[];
  likes?: { count?: number };
  is_pinned?: number;
  marked_as_pinned?: number;
  copy_history?: VkWallItem[];
};

/** Приводим VK_OWNER_ID к виду -228264930 или z_cheder */
function normalizeOwner(raw: string | undefined): string | null {
  const value = (raw ?? '').trim();
  if (!value) return null;
  const digits = value.replace(/^\+/, '');
  if (/^-?\d+$/.test(digits)) {
    return digits.startsWith('-') ? digits : `-${digits}`;
  }
  return digits.replace(/^@/, '');
}

/** screen_name -> числовой id группы (wall.get надёжнее работает с id) */
async function resolveOwnerId(owner: string, token: string): Promise<string | null> {
  if (/^-?\d+$/.test(owner)) return owner;
  try {
    const url = `${VK_API}/groups.getById?group_id=${encodeURIComponent(
      owner.replace(/^-/, ''),
    )}&v=${VK_API_VERSION}&access_token=${token}`;
    const res = await fetch(url, { next: { revalidate: 86_400 } });
    const data = await res.json();
    const group = data?.response?.groups?.[0] ?? data?.response?.[0];
    return group?.id ? `-${group.id}` : null;
  } catch (error) {
    console.error('[vkNews] groups.getById failed:', error);
    return null;
  }
}

const URL_PATTERN = /https?:\/\/\S+/gi;

function clean(value: string): string {
  return value.replace(URL_PATTERN, ' ').replace(/\s+/g, ' ').trim();
}

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  const cut = value.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  const end = lastSpace > max * 0.6 ? lastSpace : max;
  return `${cut.slice(0, end).replace(/[,.;:!?—–-]+$/, '')}…`;
}

/** Заголовок = первая строка поста, превью = остальной текст */
function splitText(raw: string): { title: string; excerpt: string } {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length <= 1) {
    return { title: truncate(clean(lines[0] ?? ''), 120), excerpt: '' };
  }

  return {
    title: truncate(clean(lines[0]), 90),
    excerpt: truncate(clean(lines.slice(1).join(' ')), 240),
  };
}

function bestUrl(sizes: VkPhotoSize[] = []): string | undefined {
  const valid = sizes.filter((size) => Boolean(size.url));
  if (!valid.length) return undefined;
  const sorted = [...valid].sort((a, b) => (a.width ?? 0) - (b.width ?? 0));
  const wanted = sorted.find((size) => (size.width ?? 0) >= 640) ?? sorted[sorted.length - 1];
  return wanted.url;
}

/** Обложка карточки: первое фото, либо превью видеозаписи */
function pickCover(attachments: VkAttachment[] = []): string | undefined {
  for (const attachment of attachments) {
    if (attachment.type === 'photo') {
      const url = bestUrl(attachment.photo?.sizes);
      if (url) return url;
    }
    if (attachment.type === 'video') {
      const url =
        bestUrl(attachment.video?.image) ??
        bestUrl(attachment.video?.first_frame) ??
        bestUrl(attachment.video?.photo);
      if (url) return url;
    }
  }
  return undefined;
}

function countPhotos(attachments: VkAttachment[] = []): number {
  return attachments.filter((attachment) => attachment.type === 'photo').length;
}

function formatDate(timestamp: number | undefined): string {
  if (!timestamp) return '';
  const date = new Date((timestamp + GROUP_TIMEZONE_OFFSET) * 1000);
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${day}.${month}.${date.getUTCFullYear()}`;
}

function toPost(item: VkWallItem, ownerId: string): VkPost | null {
  if (!item?.id) return null;

  // Репост без собственного текста показываем как новость оригинала
  const original = item.copy_history?.length
    ? item.copy_history[item.copy_history.length - 1]
    : null;
  const source = original && !(item.text ?? '').trim() ? original : item;

  const text = (source.text ?? '').trim();
  const attachments = source.attachments ?? [];
  const image = pickCover(attachments);
  const video = attachments.some((attachment) => attachment.type === 'video');
  const { title, excerpt } = splitText(text);
  const photos = countPhotos(attachments);
  const fallbackTitle = photos > 0 ? 'Фотографии' : video ? 'Видеозапись' : '';

  // Пустые посты (без текста и без обложки) в блоке новостей не нужны
  if (!title && !fallbackTitle && !image) return null;

  return {
    id: `${item.from_id ?? ownerId}_${item.id}`,
    url: `https://vk.com/wall${item.from_id ?? ownerId}_${item.id}`,
    date: formatDate(item.date),
    title: title || fallbackTitle,
    excerpt: excerpt || (title ? '' : clean(text)),
    image,
    photos,
    video,
    likes: item.likes?.count ?? 0,
    pinned: item.is_pinned === 1 || item.marked_as_pinned === 1,
  };
}

/**
 * Последние посты стены группы. Возвращает [] если VK недоступен
 * или переменные окружения не настроены.
 */
export async function getVkPosts(count = 8): Promise<VkPost[]> {
  const token = (process.env.VK_ACCESS_TOKEN ?? '').trim();
  const rawOwner = normalizeOwner(process.env.VK_OWNER_ID);

  if (!token || !rawOwner) {
    console.warn('[vkNews] VK_ACCESS_TOKEN / VK_OWNER_ID не заданы — новости VK пропущены');
    return [];
  }

  const ownerId = await resolveOwnerId(rawOwner, token);
  if (!ownerId) {
    console.error('[vkNews] не удалось определить id группы по VK_OWNER_ID');
    return [];
  }

  const params = new URLSearchParams({
    owner_id: ownerId,
    count: String(Math.min(count + 4, 100)),
    filter: 'owner',
    v: VK_API_VERSION,
    access_token: token,
  });

  try {
    const res = await fetch(`${VK_API}/wall.get?${params.toString()}`, {
      next: { revalidate: REVALIDATE_SECONDS },
    });
    const data = await res.json();

    if (data?.error) {
      console.error('[vkNews] wall.get:', data.error.error_code, data.error.error_msg);
      return [];
    }

    const items: VkWallItem[] = Array.isArray(data?.response?.items)
      ? data.response.items
      : [];

    return items
      .map((item) => toPost(item, ownerId))
      .filter((post): post is VkPost => post !== null)
      .slice(0, count);
  } catch (error) {
    console.error('[vkNews] wall.get request failed:', error);
    return [];
  }
}
