'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
          scrolled
            ? 'glass-strong shadow-[0_8px_40px_rgba(0,0,0,0.45)]'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Top bar */}
          <div className="hidden sm:flex items-center justify-between py-2 border-b border-line text-[11px] tracking-[0.08em] text-muted">
            <div className="flex items-center gap-6">
              <a href="tel:+79133405566" className="flex items-center gap-1.5 hover:text-accent transition-colors">
                <PhoneOutlined /> +7 (913) 340-55-66
              </a>
              <a href="mailto:info.cheder@yandex.ru" className="flex items-center gap-1.5 hover:text-accent transition-colors">
                <MailOutlined /> info.cheder@yandex.ru
              </a>
            </div>
            <div className="flex items-center gap-1.5">
              <EnvironmentOutlined />
              <span>Республика Тыва · озеро Чедер</span>
            </div>
          </div>

          {/* Main nav */}
          <div className={`flex items-center justify-between transition-all duration-500 ${scrolled ? 'py-2.5' : 'py-4'}`}>
            <a
              href="#hero"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-2.5 group"
            >
              <span className="relative flex h-11 w-11 items-center justify-center">
                <span className="absolute inset-0 rounded-xl bg-accent/10 border border-line group-hover:bg-accent/20 transition-colors" />
                <span className="absolute inset-0 rounded-xl blur-md bg-accent/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <img src="/images/logos/logo.png" alt="Здравница Чедер" className="relative h-8 w-auto" />
              </span>
              <span>
                <span className="font-display block text-[19px] font-semibold tracking-[0.06em] text-ink leading-tight">
                  Здравница
                </span>
                <span className="block text-[10px] tracking-[0.32em] uppercase text-accent -mt-0.5">Чедер</span>
              </span>
            </a>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-0.5">
              {navItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => scrollTo(item.key)}
                  className="group relative px-3.5 py-2 text-[13px] font-medium text-muted hover:text-ink transition-colors"
                >
                  {item.label}
                  <span className="absolute inset-x-3 -bottom-0.5 h-px bg-gradient-to-r from-accent to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
                </button>
              ))}
            </nav>

            <div className="hidden lg:flex items-center gap-3">
              <a href="tel:+79133405566" className="btn-neon !py-2.5 !px-6 !text-[13px]">
                <PhoneOutlined /> Забронировать
              </a>
            </div>

            {/* Mobile burger */}
            <button
              className="lg:hidden p-2.5 text-ink glass rounded-xl transition-colors hover:border-accent"
              onClick={open ? closeMenu : openMenu}
              aria-label={open ? 'Закрыть меню' : 'Открыть меню'}
              aria-expanded={open}
            >
              {open ? <CloseOutlined style={{ fontSize: 22 }} /> : <MenuOutlined style={{ fontSize: 22 }} />}
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
              className={`fixed inset-0 z-[90] bg-black/70 backdrop-blur-sm transition-opacity duration-[400ms] ${
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
                bg-[#070d0b] border-l border-line shadow-2xl flex flex-col
                transition-transform duration-[450ms] ease-[cubic-bezier(0.32,0.72,0,1)]
                ${open ? 'translate-x-0' : 'translate-x-full'}`}
            >
              {/* Шапка панели */}
              <div className="flex items-center justify-between px-5 h-16 border-b border-line shrink-0">
                <div className="flex items-center gap-2">
                  <img src="/images/logos/logo.png" alt="Здравница Чедер" className="h-8 w-auto" />
                  <div>
                    <div className="font-display text-[17px] font-semibold tracking-[0.06em] text-ink leading-tight">
                      Здравница
                    </div>
                    <div className="text-[10px] tracking-[0.32em] uppercase text-accent -mt-0.5">Чедер</div>
                  </div>
                </div>
                <button
                  onClick={closeMenu}
                  aria-label="Закрыть меню"
                  className="w-10 h-10 rounded-full glass flex items-center justify-center text-muted hover:text-accent hover:border-accent transition-all duration-300 active:scale-90"
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
                      hover:bg-accent/5 hover:text-accent active:scale-[0.99]
                      ${open ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'}
                      ${i === navItems.length - 1 ? '' : 'border-b border-white/5'}`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent/40 group-hover:bg-accent transition-colors" />
                      <span className="font-mono-hud text-[10px] text-accent/50">{String(i + 1).padStart(2, '0')}</span>
                      {item.label}
                    </span>
                    <span className="text-accent/40 group-hover:text-accent group-hover:translate-x-0.5 transition-all text-sm">→</span>
                  </button>
                ))}
              </nav>

              {/* Контакты и CTA */}
              <div
                style={{ transitionDelay: open ? `${150 + navItems.length * 45}ms` : '0ms' }}
                className={`shrink-0 border-t border-line px-5 py-5 space-y-3 transition-all duration-500 ease-out
                  ${open ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
              >
                <a href="tel:+79133405566" className="btn-neon w-full">
                  <PhoneOutlined /> Позвонить
                </a>
                <div className="space-y-1.5 text-sm text-muted">
                  <a href="tel:+79133440159" className="flex items-center gap-2 hover:text-accent transition-colors">
                    <PhoneOutlined className="text-accent" /> +7 (913) 344-01-59
                  </a>
                  <a href="mailto:info.cheder@yandex.ru" className="flex items-center gap-2 hover:text-accent transition-colors break-all">
                    <MailOutlined className="text-accent" /> info.cheder@yandex.ru
                  </a>
                  <div className="flex items-start gap-2 text-muted/70">
                    <EnvironmentOutlined className="text-accent mt-0.5 shrink-0" />
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
