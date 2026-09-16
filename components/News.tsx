import { Card, Tag } from 'antd';
import { CalendarOutlined, ArrowRightOutlined, SunOutlined } from '@ant-design/icons';

const news = [
  {
    date: '06.08.2026',
    title: 'На август продолжаем дарить приятные цены',
    icon: <SunOutlined className="text-yellow-500" />,
    excerpt: 'Проживание, трёхразовое питание, грязелечение, минеральная ванна, аромафитотерапия на дыхательную систему, ЛФК, приём терапевта. Действует внутренняя без % рассрочка.',
    tags: ['Акция', 'Лето'],
  },
  {
    date: '27.07.2026',
    title: 'Приём врача травматолога-ортопеда 29 июля',
    excerpt: 'Доктор медицинских наук, профессор Ондар Вячеслав Судер-оолович примет пациентов с 10:00 до 16:00. При себе необходимо иметь результаты МРТ.',
    tags: ['Врачи', 'Консультация'],
  },
  {
    date: '23.07.2026',
    title: 'Поздравляем с праздником — Наадым Биле!',
    excerpt: 'Желаем, чтобы ваши стада были полными, здоровье — крепким, а в доме всегда царили достаток и благополучие. Пусть щедрая земля дарит богатый урожай.',
    tags: ['Праздник'],
  },
  {
    date: '08.04.2026',
    title: 'Приглашаем уволенных в запас ветеранов СВО',
    excerpt: 'С 13 апреля приглашаем в курорт Чедер. Запись осуществляется через СВОих социальных координаторов или по адресу: г. Кызыл ул Красных Партизан, дом 30.',
    tags: ['СВО', 'Ветераны'],
  },
  {
    date: '08.04.2026',
    title: 'Весенняя акция — 3 990₽ за сутки',
    excerpt: 'На апрель запускаем продажи по специальной цене. В стоимость входит: проживание, трёхразовое питание, грязелечение, минеральная ванна и многое другое.',
    tags: ['Акция', 'Весна'],
  },
  {
    date: '11.03.2026',
    title: 'Как снять стресс на курорте Чедер',
    excerpt: 'Лёгкая прогулка 20-60 мин, глубокое дыхание, тёплый душ, массаж 60-90 мин, прогулки на природе, цифровой детокс, лечебная физкультура.',
    tags: ['Советы', 'Здоровье'],
  },
  {
    date: '28.04.2025',
    title: 'Программа «Женское здоровье»',
    excerpt: 'Санаторий разработал специализированную программу для женщин. Включает грязевые тампоны и орошение минеральной водой для укрепления организма.',
    tags: ['Программа', 'Здоровье'],
  },
  {
    date: '14.07.2025',
    title: 'Представительства в Красноярском крае и Новосибирске',
    excerpt: 'Открыты представительства для приобретения путевок: в Красноярске, Новосибирске, Абакане и других городах.',
    tags: ['Представительства'],
  },
];

export default function News() {
  return (
    <section id="news" className="py-20 sm:py-28 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-12 fade-section">
          <div>
            <span className="inline-block text-primary font-semibold text-sm tracking-wider uppercase mb-3">Новости</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-primary-dark">
              Последние новости
            </h2>
          </div>
          <a
            href="tel:+79133405566"
            className="mt-4 sm:mt-0 text-primary font-semibold hover:text-primary-dark transition-colors flex items-center gap-1"
          >
            Все новости <ArrowRightOutlined />
          </a>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map((n, i) => (
            <Card
              key={i}
              className="news-card fade-section border-0 shadow-md transition-all duration-300 cursor-pointer hover:shadow-xl hover:-translate-y-1 group"
              styles={{ body: { padding: '24px' } }}
            >
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                <CalendarOutlined /> {n.date}
                {n.icon && <span className="ml-1">{n.icon}</span>}
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-2.5 leading-snug line-clamp-2">
                {n.title}
              </h3>
              <p className="text-sm text-gray-600 mb-4 leading-relaxed line-clamp-3">
                {n.excerpt}
              </p>
              <div className="flex flex-wrap gap-2">
                {n.tags.map((tag) => (
                  <Tag key={tag} color="green" className="rounded-full text-xs">
                    {tag}
                  </Tag>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
