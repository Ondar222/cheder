import { Card, Tag } from 'antd';
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

function NewsCard({ item }: { item: NewsItem }) {
  const isFromVk = Boolean(item.url);

  return (
    <a
      href={item.url ?? VK_GROUP_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="block h-full shrink-0 min-w-[80%] max-w-[85%] sm:shrink sm:min-w-0 sm:max-w-none snap-center"
    >
      <Card
        className="news-card fade-section h-full border-0 shadow-sm transition-all duration-300 cursor-pointer hover:shadow-xl hover:-translate-y-1 group"
        styles={{ body: { padding: '18px' } }}
        cover={
          item.image ? (
            <div className="relative h-40 overflow-hidden bg-gray-100">
              <img
                src={item.image}
                alt={item.title}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              {item.video && (
                <span className="absolute inset-0 flex items-center justify-center text-white/90 drop-shadow">
                  <PlayCircleOutlined className="text-4xl" />
                </span>
              )}
              {(item.photos ?? 0) > 1 && (
                <span className="absolute right-2 bottom-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white">
                  <PictureOutlined /> {item.photos}
                </span>
              )}
            </div>
          ) : null
        }
      >
        <div className="flex items-center gap-2 text-[11px] text-gray-500 mb-2">
          <CalendarOutlined /> {item.date}
          {item.pinned && (
            <span
              className="ml-1 flex items-center gap-1 text-primary"
              title="Закреплённый пост"
            >
              <PushpinOutlined /> закреплено
            </span>
          )}
        </div>
        <h3
          className={`text-[15px] font-bold text-gray-900 mb-2 leading-snug group-hover:text-primary transition-colors ${
            item.excerpt ? 'line-clamp-2' : 'line-clamp-4'
          }`}
        >
          {item.title}
        </h3>
        {item.excerpt && (
          <p className="text-[13px] text-gray-600 mb-3.5 leading-relaxed line-clamp-3">
            {item.excerpt}
          </p>
        )}
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {isFromVk ? (
              <Tag color="blue" className="!rounded-full !text-[11px] !px-2 !mr-0">
                ВКонтакте
              </Tag>
            ) : (
              (item.tags ?? []).map((tag) => (
                <Tag key={tag} color="green" className="!rounded-full !text-[11px] !px-2 !mr-0">
                  {tag}
                </Tag>
              ))
            )}
          </div>
          {isFromVk && (
            <span className="flex shrink-0 items-center gap-1 text-[11px] text-gray-400">
              <LikeOutlined /> {item.likes ?? 0}
            </span>
          )}
        </div>
      </Card>
    </a>
  );
}

export default async function News() {
  const posts = await getVkPosts(POSTS_LIMIT);
  const items: NewsItem[] = posts.length > 0 ? posts.map(toNewsItem) : fallbackNews;

  return (
    <section id="news" className="py-14 sm:py-20 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-12 fade-section">
          <div>
            <span className="inline-block text-primary font-semibold text-sm tracking-wider uppercase mb-3">
              Новости
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-primary-dark">
              Последние новости
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Публикации из группы{' '}
              <a
                href={VK_GROUP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-primary hover:text-primary-dark"
              >
                vk.com/z_cheder
              </a>
            </p>
          </div>
          <a
            href={VK_GROUP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 sm:mt-0 text-primary font-semibold hover:text-primary-dark transition-colors flex items-center gap-1"
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
            {items.map((item) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
