import { PhoneOutlined, MailOutlined, EnvironmentOutlined, AppleOutlined, AndroidOutlined } from '@ant-design/icons';

export default function Footer() {
  return (
    <footer className="relative bg-[#030605] text-ink overflow-hidden">
      {/* Верхняя неоновая граница */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
      {/* Мягкое свечение */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[60vw] h-64 bg-accent/8 blur-3xl rounded-full pointer-events-none" />

      {/* Основная часть */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-16 pb-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Бренд */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-5">
              <span className="relative flex h-11 w-11 items-center justify-center">
                <span className="absolute inset-0 rounded-xl bg-accent/10 border border-line" />
                <img
                  src="/images/logos/logo.png"
                  alt="Здравница Чедер"
                  className="relative h-8 w-auto"
                />
              </span>
              <div>
                <div className="font-display text-[15px] font-semibold tracking-[0.14em] leading-tight">ЗДРАВНИЦА</div>
                <div className="font-mono-hud text-[10px] text-accent -mt-0.5">ЧЕДЕР </div>
              </div>
            </div>
            <p className="text-sm text-muted leading-relaxed mb-5">
              Курортно-оздоровительный комплекс на берегу соленого озера Чедер в Кызылском кожууне Республики Тыва.
            </p>
            <div className="flex gap-2">
              <span className="inline-flex items-center gap-1.5 glass rounded-lg px-3 py-1.5 font-mono-hud text-[10px] text-ink">
                <AppleOutlined className="text-xs" /> iOS
              </span>
              <span className="inline-flex items-center gap-1.5 glass rounded-lg px-3 py-1.5 font-mono-hud text-[10px] text-ink">
                <AndroidOutlined className="text-xs" /> Android
              </span>
            </div>
            <p className="font-mono-hud text-[10px] text-muted/50 mt-3">Yurta App</p>
          </div>

          {/* Навигация */}
          <div>
            <h4 className="font-mono-hud text-[11px] text-accent mb-5">Навигация</h4>
            <ul className="space-y-2.5">
              {['О нас', 'Услуги', 'Цены', 'Галерея', 'Новости', 'ЧаВо', 'Контакты'].map((item) => (
                <li key={item}>
                  <a
                    href={`#${item === 'О нас' ? 'hero' : item === 'Галерея' ? 'gallery' : item.toLowerCase()}`}
                    className="text-sm text-muted hover:text-accent transition-colors"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Услуги */}
          <div>
            <h4 className="font-mono-hud text-[11px] text-accent mb-5">Услуги</h4>
            <ul className="space-y-2.5 text-sm text-muted">
              <li>Грязелечение</li>
              <li>Минеральные ванны</li>
              <li>Аромафитотерапия</li>
              <li>Водолечебные процедуры</li>
              <li>Лечебная физкультура</li>
              <li>Физиотерапия</li>
              <li>Приём терапевта</li>
            </ul>
          </div>

          {/* Контакты */}
          <div>
            <h4 className="font-mono-hud text-[11px] text-accent mb-5">Контакты</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5 text-sm text-muted">
                <PhoneOutlined className="mt-0.5 text-accent shrink-0" />
                <a href="tel:+79133405566" className="hover:text-accent transition-colors">+7 (913) 340-55-66</a>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-muted">
                <PhoneOutlined className="mt-0.5 text-accent shrink-0" />
                <a href="tel:+79133440159" className="hover:text-accent transition-colors">+7 (913) 344-01-59</a>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-muted">
                <MailOutlined className="mt-0.5 text-accent shrink-0" />
                <a href="mailto:info.cheder@yandex.ru" className="hover:text-accent transition-colors break-all">info.cheder@yandex.ru</a>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-muted">
                <EnvironmentOutlined className="mt-0.5 text-accent shrink-0" />
                <span>г. Кызыл, ул. Интернациональная, 106</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Нижняя строка */}
      <div className="relative border-t border-line">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted/60">
          <span className="font-mono-hud">© {new Date().getFullYear()} ООО «Здравница Чедер» — Все права защищены</span>
          <span>Информация на сайте справочная и не является публичной офертой.</span>
        </div>
      </div>
    </footer>
  );
}
