'use client';

import { useState } from 'react';
import { Alert, Button, Form, Input } from 'antd';
import { LockOutlined, MailOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { login } from '@/lib/auth';

type LoginFormValues = { email: string; password: string };

/**
 * Вход под аккаунтом партнёра Yurta — тем же логином, что в partners-next.
 * Отдельной регистрации нет: право смотреть брони санатория даёт роль на
 * стороне API, поэтому неверные учётки просто получают 401 от /auth/login/password.
 */
export default function AdminLoginForm() {
  const router = useRouter();
  const [form] = Form.useForm<LoginFormValues>();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFinish = async (values: LoginFormValues) => {
    setSubmitting(true);
    setError(null);
    const result = await login(values.email, values.password);
    setSubmitting(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.replace('/admin');
  };

  return (
    <div className="w-full max-w-md glass-strong hud rounded-2xl p-6 sm:p-8">
      <div className="mb-7">
        <span className="hud-label">Кабинет менеджера</span>
        <h1 className="font-display text-3xl sm:text-4xl font-medium text-ink mt-3 mb-2 leading-tight">
          Здравница <span className="italic text-neon">«Чедер»</span>
        </h1>
        <p className="text-muted text-[13px] leading-relaxed">
          Заявки с сайта и брони санатория из платформы Yurta. Вход — тот же, что
          в партнёрском кабинете.
        </p>
      </div>

      {error && (
        <Alert
          type="error"
          showIcon
          message={error}
          description="Проверьте почту и пароль. Если доступ не выдавали — напишите в отдел продаж Yurta."
          className="!mb-5 !rounded-xl"
        />
      )}

      <Form form={form} layout="vertical" requiredMark={false} onFinish={handleFinish}>
        <Form.Item
          name="email"
          label={<span className="text-muted text-xs">Электронная почта</span>}
          rules={[
            { required: true, message: 'Введите почту аккаунта' },
            { type: 'email', message: 'Почта в неверном формате' },
          ]}
        >
          <Input size="large" type="email" autoComplete="username" prefix={<MailOutlined className="text-accent mr-1" />} placeholder="sales@cheder.ru" className="!rounded-xl" />
        </Form.Item>

        <Form.Item
          name="password"
          label={<span className="text-muted text-xs">Пароль</span>}
          rules={[{ required: true, message: 'Введите пароль' }]}
        >
          <Input.Password size="large" autoComplete="current-password" prefix={<LockOutlined className="text-accent mr-1" />} placeholder="••••••••" className="!rounded-xl" />
        </Form.Item>

        <Form.Item className="mb-5">
          <p className="text-[11.5px] leading-relaxed text-muted/70 m-0">
            Токен хранится в этом браузере, как в партнёрском кабинете: выход —
            кнопкой в шапке админки.
          </p>
        </Form.Item>

        <Button
          type="primary"
          htmlType="submit"
          size="large"
          block
          loading={submitting}
          className="!h-12 !rounded-full !border-0 !bg-gradient-to-r !from-[#fdf6e7] !via-[#c9f2e2] !to-[#7cd9be] !text-[#0b231b] !font-semibold !shadow-[0_8px_32px_rgba(124,217,190,0.25)] hover:!shadow-[0_14px_44px_rgba(124,217,190,0.4)] transition-all duration-300"
        >
          Войти
        </Button>
      </Form>

      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 text-[12.5px] text-muted hover:text-accent transition-colors"
      >
        <ArrowLeftOutlined className="text-[11px]" /> Вернуться на сайт
      </Link>
    </div>
  );
}
