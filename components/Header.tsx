'use client';

import { useState, useEffect } from 'react';
import { Menu, Button } from 'antd';
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (key: string) => {
    const el = document.getElementById(key);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
      setMobileOpen(false);
    }
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/98 shadow-lg backdrop-blur-md' : 'bg-white/95 backdrop-blur-md'}`}>
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
        <div className="flex items-center justify-between py-3">
          <a
            href="#hero"
            onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
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
            className="lg:hidden p-2 text-gray-700"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <CloseOutlined style={{ fontSize: 24 }} /> : <MenuOutlined style={{ fontSize: 24 }} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 shadow-lg">
          <div className="px-4 py-3 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => scrollTo(item.key)}
                className="block w-full text-left px-4 py-3 text-base font-medium text-gray-700 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
              >
                {item.label}
              </button>
            ))}
            <a href="tel:+79133405566" className="block mt-3">
              <Button type="primary" block className="bg-primary hover:bg-primary-dark border-0 rounded-full py-2.5 shadow-md hover:shadow-lg transition-all duration-300">
                <PhoneOutlined /> Позвонить
              </Button>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
