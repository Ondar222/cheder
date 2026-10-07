'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button, Spin } from 'antd';
import {
  FileTextOutlined,
  LogoutOutlined,
  PlusOutlined,
  TableOutlined,
} from '@ant-design/icons';
import { useAdminAuth } from '@/lib/auth';

const NAV = [
  { href: '/admin', label: 'Заявки', icon: <FileTextOutlined /> },
  { href: '/admin/bookings', label: 'Брони', icon: <TableOutlined /> },
  { href: '/admin/new', label: 'Создать бронь', icon: <PlusOutlined /> },
];

/**
 * Оболочка админки: проверка входа, шапка и переходы между разделами.
 *
 * Вход живёт в localStorage, поэтому guard может быть только на клиенте:
 * сервер не знает, кто открыл страницу. Страницу /admin/login guard пропускает,
 * иначе форма входа сама себя закроет редиректом.
 */
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const { ready, authed, user, logout } = useAdminAuth();
  const pathname = usePathname();
  const router = useRouter();

  const onLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (!ready) return;
    if (!authed && !onLoginPage) router.replace('/admin/login');
    if (authed && onLoginPage) router.replace('/admin');
  }, [ready, authed, onLoginPage, router]);

  // Форма входа не зависит от сессии: отдаём её сразу, не дожидаясь чтения
  // localStorage, иначе гость видел бы спиннер вместо полей логина.
  if (onLoginPage) return <>{children}</>;

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  // Страницы с чужими данными до редиректа не показываем
  if (!authed) return null;

  const displayName = [user?.surname, user?.name].filter(Boolean).join(' ') || user?.email || 'Менеджер';

  return (
    <div className="relative min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <Link href="/admin" className="flex items-center gap-2.5 shrink-0 group">
            <span className="relative flex h-10 w-10 items-center justify-center">
              <span className="absolute inset-0 rounded-xl bg-accent/10 border border-line group-hover:bg-accent/20 transition-colors" />
              <span className="absolute inset-0 rounded-xl blur-md bg-accent/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <img src="/images/logos/logo.png" alt="Здравница Чедер" className="relative h-7 w-auto" />
            </span>
            <span className="hidden sm:block leading-tight">
              <span className="block font-display text-[15px] font-semibold text-ink group-hover:text-accent transition-colors">
                Чедер
              </span>
              <span className="block font-mono-hud text-[9px] text-muted">кабинет менеджера</span>
            </span>
          </Link>

          <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative shrink-0 px-3.5 py-2 rounded-full text-[13px] font-medium transition-all duration-300 flex items-center gap-1.5 ${
                    active
                      ? 'bg-accent/12 text-accent border border-accent/30'
                      : 'text-muted hover:text-ink border border-transparent'
                  }`}
                >
                  <span className="text-[13px]">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-3 shrink-0">
            <span className="hidden lg:block text-right leading-tight">
              <span className="block text-[13px] text-ink">{displayName}</span>
              <span className="block font-mono-hud text-[9px] text-muted">{user?.email ?? ''}</span>
            </span>
            <Button
              size="small"
              icon={<LogoutOutlined />}
              onClick={logout}
              className="!rounded-full !text-[12px]"
            >
              <span className="hidden sm:inline">Выйти</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="relative flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">{children}</main>
    </div>
  );
}
