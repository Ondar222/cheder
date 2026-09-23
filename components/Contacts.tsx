'use client';

import {
  PhoneOutlined,
  MailOutlined,
  EnvironmentOutlined,
  ClockCircleOutlined,
  SendOutlined,
  WhatsAppOutlined,
  MessageOutlined,
  MobileOutlined,
  BankOutlined,
  AppleOutlined,
  AndroidOutlined,
} from '@ant-design/icons';
import { Button, Input, message, Form } from 'antd';

const { TextArea } = Input;

export default function Contacts() {
  const [form] = Form.useForm();

  const handleSubmit = async (values: Record<string, unknown>) => {
    try {
      await form.validateFields();
      message.success('Спасибо! Ваша заявка отправлена. Мы свяжемся с вами в ближайшее время.');
      form.resetFields();
    } catch {
      message.error('Пожалуйста, заполните все поля корректно.');
    }
  };

  return (
    <section id="contacts" className="relative py-20 sm:py-28 bg-bg-2/40 overflow-hidden">
      {/* Разделитель-линия */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[min(72rem,92%)] h-px bg-gradient-to-r from-transparent via-line to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(60vw_40vw_at_50%_0%,rgba(124,217,190,0.05),transparent_70%)] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 reveal">
          <span className="hud-label">Контакты</span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-ink mt-5 mb-4">
            Свяжитесь <span className="text-neon">с нами</span>
          </h2>
          <p className="text-muted max-w-xl mx-auto">
            Отдел продаж готов ответить на все ваши вопросы и помочь с бронированием
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-5">
          {/* Контактная информация */}
          <div className="lg:col-span-2 flex flex-col gap-4 fade-section">
            <div className="hud glass rounded-2xl p-6">
              <div className="space-y-5">
                {[
                  {
                    icon: <PhoneOutlined style={{ fontSize: 18 }} />,
                    label: 'Телефон отдела продаж',
                    content: (
                      <>
                        <a href="tel:+79133405566" className="text-base font-semibold text-ink hover:text-accent transition-colors block">
                          +7 (913) 340-55-66
                        </a>
                        <a href="tel:+79133440159" className="text-sm text-muted mt-0.5 hover:text-accent transition-colors block">
                          +7 (913) 344-01-59
                        </a>
                      </>
                    ),
                  },
                  {
                    icon: <MailOutlined style={{ fontSize: 18 }} />,
                    label: 'Электронная почта',
                    content: (
                      <>
                        <a href="mailto:info.cheder@yandex.ru" className="text-base font-semibold text-ink hover:text-accent transition-colors break-all block">
                          info.cheder@yandex.ru
                        </a>
                        <p className="text-xs text-muted/70 mt-1">Для резюме: массажисты, медсестры</p>
                      </>
                    ),
                  },
                  {
                    icon: <EnvironmentOutlined style={{ fontSize: 18 }} />,
                    label: 'Адрес отдела продаж',
                    content: (
                      <div className="text-sm font-medium text-ink">
                        Россия, Республика Тыва,
                        <br />г. Кызыл, ул. Интернациональная, 106
                      </div>
                    ),
                  },
                  {
                    icon: <ClockCircleOutlined style={{ fontSize: 18 }} />,
                    label: 'Режим работы отдела продаж',
                    content: (
                      <div className="text-sm font-medium text-ink">
                        Пн–Пт: 9:00 — 18:00
                        <br />Сб–Вс: по предварительной записи
                      </div>
                    ),
                  },
                ].map((row) => (
                  <div key={row.label} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/25 flex items-center justify-center text-accent shrink-0">
                      {row.icon}
                    </div>
                    <div>
                      <div className="font-mono-hud text-[10px] text-muted mb-1">{row.label}</div>
                      {row.content}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Быстрые действия */}
            <div className="grid grid-cols-2 gap-3">
              <a href="https://wa.me/79133405566" target="_blank" rel="noopener noreferrer">
                <Button block className="!h-11 !rounded-xl !border-0 !bg-[#128C7E] hover:!bg-[#1faa59] !text-white !shadow-md hover:!shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                  <WhatsAppOutlined /> WhatsApp
                </Button>
              </a>
              <a href="https://viber.chat/z9n5Jr" target="_blank" rel="noopener noreferrer">
                <Button block className="!h-11 !rounded-xl !border-0 !bg-[#7360F2] hover:!bg-[#8576f5] !text-white !shadow-md hover:!shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                  <MessageOutlined /> Viber
                </Button>
              </a>
            </div>

            {/* Онлайн-бронирование */}
            <div className="hud glass-strong rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2.5">
                <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0">
                  <MobileOutlined style={{ fontSize: 18 }} />
                </div>
                <h4 className="font-display text-base font-semibold text-ink m-0">Онлайн-бронирование</h4>
              </div>
              <p className="text-sm text-muted leading-relaxed mb-4">
                Бронируйте отдых напрямую в приложении Yurta App
              </p>
              <div className="flex gap-2">
                <span className="inline-flex items-center gap-1.5 glass rounded-lg px-3 py-1.5 font-mono-hud text-[10px] text-ink">
                  <AppleOutlined className="text-xs" /> iOS
                </span>
                <span className="inline-flex items-center gap-1.5 glass rounded-lg px-3 py-1.5 font-mono-hud text-[10px] text-ink">
                  <AndroidOutlined className="text-xs" /> Android
                </span>
              </div>
            </div>

            {/* Представительства */}
            <div className="hud glass rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-2.5">
                <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/25 flex items-center justify-center text-accent shrink-0">
                  <BankOutlined style={{ fontSize: 18 }} />
                </div>
                <h4 className="font-display text-base font-semibold text-ink m-0">Представительства</h4>
              </div>
              <p className="text-sm text-muted leading-relaxed mb-3.5">
                Для жителей Красноярского края и Новосибирской области
              </p>
              <div className="rounded-xl bg-white/[0.03] border border-line px-4 py-3.5 space-y-2">
                <div className="text-sm font-semibold text-ink">Красноярск</div>
                <div className="flex items-start gap-2.5 text-sm text-muted">
                  <EnvironmentOutlined className="mt-0.5 text-accent shrink-0" />
                  <span>пр. Красноярский Рабочий, 59, оф. 209</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm">
                  <PhoneOutlined className="text-accent shrink-0" />
                  <a href="tel:+73912823830" className="font-semibold text-ink hover:text-accent transition-colors">
                    +7 (391) 282-38-30
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Форма заявки */}
          <div className="lg:col-span-3 fade-section">
            <div className="hud glass-strong rounded-2xl p-7 h-full">
              <h3 className="font-display text-lg font-semibold text-ink mb-6">Оставить заявку</h3>
              <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Form.Item name="name" label={<span className="text-muted text-xs">Ваше имя</span>} rules={[{ required: true, message: 'Введите имя' }]}>
                    <Input placeholder="Иван Иванов" size="large" className="!rounded-xl" />
                  </Form.Item>
                  <Form.Item name="phone" label={<span className="text-muted text-xs">Телефон</span>} rules={[{ required: true, message: 'Введите телефон' }]}>
                    <Input placeholder="+7 (___) ___-__-__" size="large" className="!rounded-xl" />
                  </Form.Item>
                </div>
                <Form.Item name="email" label={<span className="text-muted text-xs">Email</span>} rules={[{ type: 'email', message: 'Введите корректный email' }]}>
                  <Input placeholder="example@mail.ru" size="large" className="!rounded-xl" />
                </Form.Item>
                <Form.Item name="message" label={<span className="text-muted text-xs">Сообщение</span>}>
                  <TextArea
                    rows={3}
                    placeholder="Расскажите о ваших пожеланиях..."
                    size="large"
                    className="!rounded-xl resize-none"
                  />
                </Form.Item>
                <Form.Item className="mb-0">
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SendOutlined />}
                    size="large"
                    className="!h-12 !px-8 !rounded-full !border-0 !bg-gradient-to-r !from-[#9ff5dc] !to-[#2ee6b8] !text-[#04120d] !font-semibold !shadow-[0_8px_32px_rgba(46,230,184,0.25)] hover:!shadow-[0_14px_44px_rgba(46,230,184,0.45)] hover:-translate-y-0.5 transition-all duration-300 !text-[15px]"
                  >
                    Отправить заявку
                  </Button>
                </Form.Item>
              </Form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
