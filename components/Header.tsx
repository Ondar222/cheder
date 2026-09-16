'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Button } from 'antd';
import {
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  MenuOutlined,
  CloseOutlined,
} from '@ant-design/icons';

const navItems = [
  { key: 'about', label: 'О нас' },
  { key: 'services', label: 'Услуги' },
  { key: 'prices', label: 'Цены' },
  { key: 'gallery', label: 'Галерея' },
  { key: 'news', label: 'Новости' },
  { key: 'faq', label: 'ЧаВо' },
  { key: 'contacts', label: 'Контакты' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  // drawer смонтирован (нужен для анимации выезда/уезда)
  const [mounted, setMounted] = useState(false);
  // drawer открыт (translate-x-0)
  const [open, setOpen] = useState(false);
  const [touchX, setTouchX] = useState<number | null>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const openMenu = () => {
    setMounted(true);
    // Два кадра паузы: браузер успевает отрисовать панель за экраном,
    // иначе переход translate-x-full → translate-x-0 не проиграется.
    requestAnimationFrame(() => requestAnimationFrame(() => setOpen(true)));
  };

  const closeMenu = useCallback(() => {
    setOpen(false);
    setTimeout(() => setMounted(false), 450);
  }, []);

  // Блокируем прокрутку страницы под открытой панелью + закрытие по Esc
  useEffect(() => {
    if (!mounted) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [mounted, closeMenu]);

  // Свайп влево — закрыть
  const onTouchStart = (e: React.TouchEvent) => setTouchX(e.touches[0].clientX);
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX !== null && touchX - e.changedTouches[0].clientX > 60) closeMenu();
    setTouchX(null);
  };

  const scrollTo = (key: string) => {
    closeMenu();
    // Сначала панель уезжает за экран, затем плавно скроллим к секции
    setTimeout(() => document.getElementById(key)?.scrollIntoView({ behavior: 'smooth' }), 300);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled ? 'bg-white/95 shadow-lg backdrop-blur-md' : 'bg-white/90 backdrop-blur-md'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Top bar */}
          <div className="hidden sm:flex items-center justify-between py-2 border-b border-gray-100 text-sm text-gray-600">
            <div className="flex items-center gap-6">
              <a href="tel:+79133405566" className="flex items-center gap-1.5 hover:text-primary transition-colors">
                <PhoneOutlined /> +7 (913) 340-55-66
              </a>
              <a href="mailto:info.cheder@yandex.ru" className="flex items-center gap-1.5 hover:text-primary transition-colors">
                <MailOutlined /> info.cheder@yandex.ru
              </a>
            </div>
            <div className="flex items-center gap-1.5">
              <EnvironmentOutlined />
              <span>Республика Тыва, г. Кызыл, ул. Интернациональная, 106</span>
            </div>
          </div>

          {/* Main nav */}
          <div className={`flex items-center justify-between transition-all duration-500 ${scrolled ? 'py-2' : 'py-3'}`}>
            <a
              href="#hero"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-2 group"
            >
              <img src="/images/logos/logo.png" alt="Здравница Чедер" className="h-10 w-auto" />
              <div>
                <div className="text-lg font-bold text-primary-dark leading-tight">ЗДРАВНИЦА</div>
                <div className="text-xs text-gray-500 -mt-0.5">ЧЕДЕР</div>
              </div>
            </a>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => scrollTo(item.key)}
                  className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                >
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="hidden lg:flex items-center gap-3">
              <a href="tel:+79133405566">
                <Button type="primary" className="bg-primary hover:bg-primary-dark border-0 rounded-full px-5 shadow-md hover:shadow-lg transition-all duration-300">
                  <PhoneOutlined /> Позвонить
                </Button>
              </a>
            </div>

            {/* Mobile burger */}
            <button
              className="lg:hidden p-2 text-primary-dark rounded-xl transition-colors hover:bg-primary/5"
              onClick={open ? closeMenu : openMenu}
              aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
              aria-expanded={open}
            >
              {open ? <CloseOutlined style={{ fontSize: 24 }} /> : <MenuOutlined style={{ fontSize: 24 }} />}
            </button>
          </div>
        </div>
      </header>

      {/*
        Drawer рендерится порталом в <body>.
        Внутри <header> его быть не может: backdrop-blur на шапке создаёт
        фильтрованный контекст, из-за которого position:fixed обрезается
        высотой шапки — панель и затемнение «пропадали».
      */}
      {mounted &&
        createPortal(
          <div className="lg:hidden">
            {/* Затемнение всего экрана */}
            <div
              onClick={closeMenu}
              aria-hidden="true"
              className={`fixed inset-0 z-[90] bg-primary-dark/50 backdrop-blur-[3px] transition-opacity duration-[400ms] ${
                open ? 'opacity-100' : 'opacity-0 pointer-events-none'
              }`}
            />

            {/* Панель: выезжает справа и растягивается до левого края */}
            <aside
              role="dialog"
              aria-modal="true"
              aria-label="Меню навигации"
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
              className={`fixed top-0 right-0 bottom-0 z-[100] w-full sm:w-[440px]
                bg-white shadow-2xl flex flex-col
                transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)]
                ${open ? 'translate-x-0' : 'translate-x-full'}`}
            >
              {/* Шапка панели */}
              <div className="flex items-center justify-between px-5 h-16 border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-2">
                  <img src="/images/logos/logo.png" alt="Здравница Чедер" className="h-9 w-auto" />
                  <div>
                    <div className="text-sm font-bold text-primary-dark leading-tight">ЗДРАВНИЦА</div>
                    <div className="text-[11px] text-gray-500 -mt-0.5">ЧЕДЕР</div>
                  </div>
                </div>
                <button
                  onClick={closeMenu}
                  aria-label="Закрыть меню"
                  className="w-10 h-10 rounded-full flex items-center justify-center text-gray-500 bg-gray-100 hover:bg-primary/10 hover:text-primary transition-all duration-300 active:scale-90"
                >
                  <CloseOutlined style={{ fontSize: 18 }} />
                </button>
              </div>

              {/* Пункты меню — появляются каскадом */}
              <nav className="flex-1 overflow-y-auto px-4 py-4">
                {navItems.map((item, i) => (
                  <button
                    key={item.key}
                    onClick={() => scrollTo(item.key)}
                    style={{ transitionDelay: open ? `${150 + i * 45}ms` : '0ms' }}
                    className={`group flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3.5 text-left
                      text-[15px] font-medium transition-all duration-500 ease-out
                      hover:bg-primary/5 hover:text-primary active:scale-[0.99]
                      ${open ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'}
                      ${i === navItems.length - 1 ? '' : 'border-b border-gray-50'}`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/25 group-hover:bg-primary transition-colors" />
                      {item.label}
                    </span>
                    <span className="text-gray-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all text-sm">→</span>
                  </button>
                ))}
              </nav>

              {/* Контакты и CTA */}
              <div
                style={{ transitionDelay: open ? `${150 + navItems.length * 45}ms` : '0ms' }}
                className={`shrink-0 border-t border-gray-100 px-5 py-5 space-y-3 transition-all duration-500 ease-out
                  ${open ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
              >
                <a href="tel:+79133405566" className="block">
                  <Button
                    type="primary"
                    block
                    size="large"
                    className="!bg-primary hover:!bg-primary-dark border-0 rounded-full h-12 font-semibold shadow-lg shadow-primary/25 transition-all duration-300"
                  >
                    <PhoneOutlined /> Позвонить
                  </Button>
                </a>
                <div className="space-y-1.5 text-sm text-gray-600">
                  <a href="tel:+79133440159" className="flex items-center gap-2 hover:text-primary transition-colors">
                    <PhoneOutlined className="text-primary" /> +7 (913) 344-01-59
                  </a>
                  <a href="mailto:info.cheder@yandex.ru" className="flex items-center gap-2 hover:text-primary transition-colors break-all">
                    <MailOutlined className="text-primary" /> info.cheder@yandex.ru
                  </a>
                  <div className="flex items-start gap-2 text-gray-500">
                    <EnvironmentOutlined className="text-primary mt-0.5 shrink-0" />
                    <span>г. Кызыл, ул. Интернациональная, 106</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>,
          document.body,
        )}
    </>
  );
}
