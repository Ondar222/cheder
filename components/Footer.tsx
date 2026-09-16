import { PhoneOutlined, MailOutlined, EnvironmentOutlined, AppleOutlined, AndroidOutlined } from '@ant-design/icons';

export default function Footer() {
  return (
    <footer className="bg-primary-dark text-white">
      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img
                src="/images/logos/logo.png"
                alt="Здравница Чедер"
                className="h-10 w-auto brightness-0 invert"
              />
              <div>
                <div className="text-lg font-bold leading-tight">ЗДРАВНИЦА</div>
                <div className="text-xs text-white/60 -mt-0.5">ЧЕДЕР</div>
              </div>
            </div>
            <p className="text-sm text-white/60 leading-relaxed mb-4">
              Курортно-оздоровительный комплекс на берегу соленого озера Чедер в Кызылском кожууне Республики Тыва.
            </p>
            <div className="flex gap-2">
              <span className="inline-flex items-center gap-1 bg-white/10 rounded-lg px-3 py-1.5 text-xs font-medium">
                <AppleOutlined className="text-xs" />
                iOS
              </span>
              <span className="inline-flex items-center gap-1 bg-white/10 rounded-lg px-3 py-1.5 text-xs font-medium">
                <AndroidOutlined className="text-xs" />
                Android
              </span>
            </div>
            <p className="text-xs text-white/40 mt-2">Yurta App</p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-bold text-base mb-4">Навигация</h4>
            <ul className="space-y-2.5">
              {['О нас', 'Услуги', 'Цены', 'Галерея', 'Новости', 'ЧаВо', 'Контакты'].map((item) => (
                <li key={item}>
                  <a
                    href={`#${item === 'О нас' ? 'hero' : item === 'Галерея' ? 'gallery' : item.toLowerCase()}`}
                    className="text-sm text-white/60 hover:text-white transition-colors"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-bold text-base mb-4">Услуги</h4>
            <ul className="space-y-2.5 text-sm text-white/60">
              <li>Грязелечение</li>
              <li>Минеральные ванны</li>
              <li>Аромафитотерапия</li>
              <li>Водолечебные процедуры</li>
              <li>Лечебная физкультура</li>
              <li>Физиотерапия</li>
              <li>Приём терапевта</li>
            </ul>
          </div>

          {/* Contacts */}
          <div>
            <h4 className="font-bold text-base mb-4">Контакты</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5 text-sm text-white/60">
                <PhoneOutlined className="mt-0.5 flex-shrink-0" />
                <a href="tel:+79133405566" className="hover:text-white transition-colors">+7 (913) 340-55-66</a>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-white/60">
                <PhoneOutlined className="mt-0.5 flex-shrink-0" />
                <a href="tel:+79133440159" className="hover:text-white transition-colors">+7 (913) 344-01-59</a>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-white/60">
                <MailOutlined className="mt-0.5 flex-shrink-0" />
                <a href="mailto:info.cheder@yandex.ru" className="hover:text-white transition-colors">info.cheder@yandex.ru</a>
              </li>
              <li className="flex items-start gap-2.5 text-sm text-white/60">
                <EnvironmentOutlined className="mt-0.5 flex-shrink-0" />
                <span>г. Кызыл, ул. Интернациональная, 106</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-white/50">
          <span>© {new Date().getFullYear()} ООО «Здравница Чедер». Все права защищены.</span>
          <span className="text-xs">Информация на сайте справочная и не является публичной офертой.</span>
        </div>
      </div>
    </footer>
  );
}
