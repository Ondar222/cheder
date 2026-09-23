import {
  CalendarOutlined,
  ArrowRightOutlined,
  LikeOutlined,
  PictureOutlined,
  PlayCircleOutlined,
  PushpinOutlined,
} from '@ant-design/icons';
import { getVkPosts, type VkPost } from '@/lib/vkNews';

const VK_GROUP_URL = 'https://vk.com/z_cheder';
const POSTS_LIMIT = 8;

type NewsItem = {
  id: string;
  date: string;
  title: string;
  excerpt: string;
  image?: string;
  url?: string;
  tags?: string[];
  photos?: number;
  video?: boolean;
  likes?: number;
  pinned?: boolean;
};

/** Статичный фолбэк на случай недоступности VK API */
const fallbackNews: NewsItem[] = [
  {
    id: 'fallback-1',
    date: '06.08.2026',
    title: 'На август продолжаем дарить приятные цены',
    excerpt:
      'Проживание, трёхразовое питание, грязелечение, минеральная ванна, аромафитотерапия на дыхательную систему, ЛФК, приём терапевта. Действует внутренняя без % рассрочка.',
    tags: ['Акция', 'Лето'],
  },
  {
    id: 'fallback-2',
    date: '27.07.2026',
    title: 'Приём врача травматолога-ортопеда 29 июля',
    excerpt:
      'Доктор медицинских наук, профессор Ондар Вячеслав Судер-оолович примет пациентов с 10:00 до 16:00. При себе необходимо иметь результаты МРТ.',
    tags: ['Врачи', 'Консультация'],
  },
  {
    id: 'fallback-3',
    date: '23.07.2026',
    title: 'Поздравляем с праздником — Наадым Биле!',
    excerpt:
      'Желаем, чтобы ваши стада были полными, здоровье — крепким, а в доме всегда царили достаток и благополучие. Пусть щедрая земля дарит богатый урожай.',
    tags: ['Праздник'],
  },
  {
    id: 'fallback-4',
    date: '08.04.2026',
    title: 'Приглашаем уволенных в запас ветеранов СВО',
    excerpt:
      'С 13 апреля приглашаем в курорт Чедер. Запись осуществляется через СВОих социальных координаторов или по адресу: г. Кызыл ул Красных Партизан, дом 30.',
    tags: ['СВО', 'Ветераны'],
  },
];

function toNewsItem(post: VkPost): NewsItem {
  return {
    id: post.id,
    date: post.date,
    title: post.title,
    excerpt: post.excerpt,
    image: post.image,
    url: post.url,
    photos: post.photos,
    video: post.video,
    likes: post.likes,
    pinned: post.pinned,
  };
}

function NewsCard({ item, index }: { item: NewsItem; index: number }) {
  const isFromVk = Boolean(item.url);

  return (
    <a
      href={item.url ?? VK_GROUP_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`fade-section block h-full shrink-0 min-w-[80%] max-w-[85%] sm:shrink sm:min-w-0 sm:max-w-none snap-center group glass rounded-2xl overflow-hidden transition-all duration-300 hover:border-accent/40 hover:shadow-[0_20px_60px_rgba(46,230,184,0.1)] hover:-translate-y-1 r-${((index % 4) + 1) * 100}`}
    >
      {item.image && (
        <div className="relative h-40 overflow-hidden bg-bg-2">
          <img
            src={item.image}
            alt={item.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          {item.video && (
            <span className="absolute inset-0 flex items-center justify-center text-accent drop-shadow-[0_0_12px_rgba(46,230,184,0.8)]">
              <PlayCircleOutlined className="text-4xl" />
            </span>
          )}
          {(item.photos ?? 0) > 1 && (
            <span className="absolute right-2 bottom-2 flex items-center gap-1 rounded-full bg-black/60 backdrop-blur-sm px-2 py-0.5 font-mono-hud text-[10px] text-accent">
              <PictureOutlined /> {item.photos}
            </span>
          )}
        </div>
      )}
      <div className="p-[18px] flex flex-col h-full">
        <div className="flex items-center gap-2 font-mono-hud text-[10px] text-muted mb-2.5">
          <CalendarOutlined /> {item.date}
          {item.pinned && (
            <span className="ml-1 flex items-center gap-1 text-accent" title="Закреплённый пост">
              <PushpinOutlined /> закреплено
            </span>
          )}
        </div>
        <h3
          className={`text-[15px] font-semibold text-ink mb-2 leading-snug group-hover:text-accent transition-colors ${
            item.excerpt ? 'line-clamp-2' : 'line-clamp-4'
          }`}
        >
          {item.title}
        </h3>
        {item.excerpt && (
          <p className="text-[13px] text-muted mb-4 leading-relaxed line-clamp-3">
            {item.excerpt}
          </p>
        )}
        <div className="flex items-center justify-between gap-2 mt-auto">
          <div className="flex flex-wrap gap-1.5">
            {isFromVk ? (
              <span className="inline-flex rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-medium text-accent">
                ВКонтакте
              </span>
            ) : (
              (item.tags ?? []).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex rounded-full border border-warm/30 bg-warm/10 px-2 py-0.5 text-[10px] font-medium text-warm"
                >
                  {tag}
                </span>
              ))
            )}
          </div>
          {isFromVk && (
            <span className="flex shrink-0 items-center gap-1 font-mono-hud text-[10px] text-muted">
              <LikeOutlined /> {item.likes ?? 0}
            </span>
          )}
        </div>
      </div>
    </a>
  );
}

export default async function News() {
  const posts = await getVkPosts(POSTS_LIMIT);
  const items: NewsItem[] = posts.length > 0 ? posts.map(toNewsItem) : fallbackNews;

  return (
    <section id="news" className="relative py-20 sm:py-28">
      {/* Разделитель-линия */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[min(72rem,92%)] h-px bg-gradient-to-r from-transparent via-line to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-12 fade-section">
          <div>
            <span className="hud-label">Новости</span>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-ink mt-5">
              Последние <span className="text-neon">новости</span>
            </h2>
            <p className="mt-3 text-sm text-muted">
              Публикации из группы{' '}
              <a
                href={VK_GROUP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-accent hover:text-accent-2 transition-colors"
              >
                vk.com/z_cheder
              </a>
            </p>
          </div>
          <a
            href={VK_GROUP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 sm:mt-0 btn-ghost !py-2.5 !px-5 !text-[13px]"
          >
            Все новости <ArrowRightOutlined />
          </a>
        </div>

        {/*
          Один ряд во всех версиях. На мобильных карточки стоят в ряд и
          листаются свайпом (snap-карусель), от планшета — обычная сетка.
        */}
        <div className="-mx-4 sm:mx-0 -my-6 sm:my-0">
          <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 overflow-x-auto sm:overflow-visible no-scrollbar snap-x snap-proximity px-4 sm:px-0 py-6 sm:py-0">
            {items.map((item, index) => (
              <NewsCard key={item.id} item={item} index={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
