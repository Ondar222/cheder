'use client';

import { Button, Card, Input, message, Form } from 'antd';
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
    <section id="contacts" className="py-14 sm:py-20 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-9 fade-section">
          <span className="inline-block text-primary font-semibold text-sm tracking-wider uppercase mb-3">Контакты</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-primary-dark mb-3">
            Свяжитесь с нами
          </h2>
          <p className="text-gray-600 max-w-xl mx-auto">
            Отдел продаж готов ответить на все ваши вопросы и помочь с бронированием
          </p>
        </div>

        <div className="grid lg:grid-cols-5 gap-5">
          {/* Contact info */}
          <div className="lg:col-span-2 flex flex-col gap-4 fade-section">
            <Card className="border-0 shadow-md" styles={{ body: { padding: 20 } }}>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                    <PhoneOutlined style={{ fontSize: 20 }} />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Телефон отдела продаж</div>
                    <a href="tel:+79133405566" className="text-base font-bold text-gray-900 hover:text-primary transition-colors block">
                      +7 (913) 340-55-66
                    </a>
                    <div className="text-sm text-gray-500 mt-0.5">
                      <a href="tel:+79133440159" className="hover:text-primary transition-colors block">
                        +7 (913) 344-01-59
                      </a>
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                    <MailOutlined style={{ fontSize: 20 }} />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Электронная почта</div>
                    <a href="mailto:info.cheder@yandex.ru" className="text-base font-bold text-gray-900 hover:text-primary transition-colors break-all">
                      info.cheder@yandex.ru
                    </a>
                    <p className="text-xs text-gray-400 mt-1">Для резюме: массажисты, медсестры</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                    <EnvironmentOutlined style={{ fontSize: 20 }} />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Адрес отдела продаж</div>
                    <div className="text-sm font-semibold text-gray-900">
                      Россия, Республика Тыва,
                      <br />г. Кызыл, ул. Интернациональная, 106
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                    <ClockCircleOutlined style={{ fontSize: 20 }} />
                  </div>
                  <div>
                    <div className="text-sm text-gray-500 mb-1">Режим работы отдела продаж</div>
                    <div className="text-sm font-semibold text-gray-900">
                      Пн–Пт: 9:00 — 18:00
                      <br />Сб–Вс: по предварительной записи
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-3">
              <a href="https://wa.me/79133405566" target="_blank" rel="noopener noreferrer">
                <Button block className="bg-green-500 hover:bg-green-600 text-white border-0 rounded-xl h-11 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                  <WhatsAppOutlined /> WhatsApp
                </Button>
              </a>
              <a href="https://viber.chat/z9n5Jr" target="_blank" rel="noopener noreferrer">
                <Button block className="bg-violet-600 hover:bg-violet-700 text-white border-0 rounded-xl h-11 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                  <MessageOutlined /> Viber
                </Button>
              </a>
            </div>

            {/* Онлайн-бронирование */}
            <Card
              className="border-0 shadow-md bg-gradient-to-r from-primary to-primary-light text-white hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              styles={{ body: { padding: 20 } }}
            >
              <div className="flex items-center gap-3 mb-2.5">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <MobileOutlined style={{ fontSize: 20 }} />
                </div>
                <h4 className="text-base font-bold m-0">Онлайн-бронирование</h4>
              </div>
              <p className="text-sm text-white/80 leading-relaxed mb-4">
                Бронируйте отдых напрямую в приложении Yurta App
              </p>
              <div className="flex gap-2">
                <span className="inline-flex items-center gap-1.5 bg-white/20 rounded-lg px-3 py-1.5 text-xs font-medium">
                  <AppleOutlined className="text-xs" /> iOS
                </span>
                <span className="inline-flex items-center gap-1.5 bg-white/20 rounded-lg px-3 py-1.5 text-xs font-medium">
                  <AndroidOutlined className="text-xs" /> Android
                </span>
              </div>
            </Card>

            {/* Представительства */}
            <Card className="border-0 shadow-md bg-white" styles={{ body: { padding: 20 } }}>
              <div className="flex items-center gap-3 mb-2.5">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                  <BankOutlined style={{ fontSize: 20 }} />
                </div>
                <h4 className="text-base font-bold text-gray-900 m-0">Представительства</h4>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-3.5">
                Для жителей Красноярского края и Новосибирской области
              </p>
              <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3.5 space-y-2">
                <div className="text-sm font-bold text-gray-900">Красноярск</div>
                <div className="flex items-start gap-2.5 text-sm text-gray-600">
                  <EnvironmentOutlined className="mt-0.5 text-primary flex-shrink-0" />
                  <span>пр. Красноярский Рабочий, 59, оф. 209</span>
                </div>
                <div className="flex items-center gap-2.5 text-sm">
                  <PhoneOutlined className="text-primary flex-shrink-0" />
                  <a href="tel:+73912823830" className="font-semibold text-gray-900 hover:text-primary transition-colors">
                    +7 (391) 282-38-30
                  </a>
                </div>
              </div>
            </Card>
          </div>

          {/* Contact form */}
          <div className="lg:col-span-3 fade-section">
            <Card className="border-0 shadow-md h-full" styles={{ body: { padding: 20 } }}>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Оставить заявку</h3>
              <Form form={form} layout="vertical" onFinish={handleSubmit}>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Form.Item name="name" label="Ваше имя" rules={[{ required: true, message: 'Введите имя' }]}>
                    <Input placeholder="Иван Иванов" size="large" className="rounded-xl border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                  </Form.Item>
                  <Form.Item name="phone" label="Телефон" rules={[{ required: true, message: 'Введите телефон' }]}>
                    <Input placeholder="+7 (___) ___-__-__" size="large" className="rounded-xl border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                  </Form.Item>
                </div>
                <Form.Item name="email" label="Email" rules={[{ type: 'email', message: 'Введите корректный email' }]}>
                  <Input placeholder="example@mail.ru" size="large" className="rounded-xl border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                </Form.Item>
                <Form.Item name="message" label="Сообщение">
                  <TextArea
                    rows={3}
                    placeholder="Расскажите о ваших пожеланиях..."
                    size="large"
                    className="rounded-xl resize-none border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                  />
                </Form.Item>
                <Form.Item>
                  <Button
                    type="primary"
                    htmlType="submit"
                    icon={<SendOutlined />}
                    size="large"
                    className="bg-primary hover:bg-primary-dark border-0 rounded-xl px-8 h-11 text-[15px] font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
                  >
                    Отправить заявку
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
