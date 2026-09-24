'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Checkbox,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Radio,
  Select,
  message,
} from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import {
  CalendarOutlined,
  CheckOutlined,
  MoonOutlined,
  PhoneOutlined,
  SafetyOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import {
  DEFAULT_RATE_ID,
  DEFAULT_ROOM_TYPE_ID,
  EXTRA_GUEST_PRICE,
  MAX_EXTRA_GUESTS,
  MAX_NIGHTS,
  RATES,
  ROOM_TYPES,
  calcTotal,
  findRate,
  findRoomType,
  formatPhone,
  formatPrice,
  isPhoneComplete,
  phoneToE164,
  pluralNights,
  pricePerNight,
  roomTypeLabel,
  submitBooking,
  type BookingFormValues,
} from '@/lib/booking';

const { TextArea } = Input;

export type BookingModalProps = {
  open: boolean;
  onClose: () => void;
  /** Категория номера по умолчанию */
  initialRoomTypeId?: string;
  /** Тариф, выбранный по умолчанию (обычно — из карточки цен) */
  initialRateId?: string;
  /** Откуда открыли форму — попадает в заявку для аналитики */
  source?: string;
};

const DEFAULT_NIGHTS = 3;

export default function BookingModal({
  open,
  onClose,
  initialRoomTypeId = DEFAULT_ROOM_TYPE_ID,
  initialRateId = DEFAULT_RATE_ID,
  source = 'site',
}: BookingModalProps) {
  const [form] = Form.useForm<BookingFormValues>();
  const [messageApi, contextHolder] = message.useMessage();
  const [submitting, setSubmitting] = useState(false);

  // Единый источник истины — сама форма; useWatch даёт реактивность для «Итого»
  const rateId = Form.useWatch('rateId', form) ?? initialRateId;
  const roomTypeId = Form.useWatch('roomTypeId', form) ?? initialRoomTypeId;
  const nights = Form.useWatch('nights', form) ?? DEFAULT_NIGHTS;
  const hasExtraGuest = Form.useWatch('hasExtraGuest', form) ?? 'no';
  const extraGuests = Form.useWatch('extraGuests', form) ?? 1;

  const rate = useMemo(() => findRate(rateId), [rateId]);
  const room = useMemo(() => findRoomType(roomTypeId), [roomTypeId]);

  const guests = hasExtraGuest === 'yes' ? extraGuests : 0;
  const perNight = pricePerNight(rate, guests);
  const total = calcTotal(rate, nights, guests);

  // При каждом открытии — актуальные тариф/категория и чистая форма
  useEffect(() => {
    if (!open) return;
    form.setFieldsValue({
      rateId: findRate(initialRateId).id,
      roomTypeId: findRoomType(initialRoomTypeId).id,
      hasExtraGuest: 'no',
      extraGuests: 1,
      nights: DEFAULT_NIGHTS,
    });
  }, [open, initialRateId, initialRoomTypeId, form]);

  const handleFinish = async (values: BookingFormValues) => {
    const chosenRate = findRate(values.rateId);
    const chosenRoom = findRoomType(values.roomTypeId);
    const extra = values.hasExtraGuest === 'yes' ? values.extraGuests ?? 1 : 0;
    const nightsCount = values.nights ?? 1;

    setSubmitting(true);
    try {
      await submitBooking({
        ...values,
        phone: phoneToE164(values.phone) || values.phone,
        ratePeriod: chosenRate.period,
        roomTypeLabel: roomTypeLabel(chosenRoom),
        pricePerNight: pricePerNight(chosenRate, extra),
        extraGuestsPrice: EXTRA_GUEST_PRICE * extra,
        total: calcTotal(chosenRate, nightsCount, extra),
        submittedAt: new Date().toISOString(),
        source,
      });
      messageApi.success('Заявка отправлена! Мы свяжемся с вами в течение рабочего дня.', 5);
      onClose();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[booking]', error);
      messageApi.error('Не удалось отправить заявку. Позвоните нам: +7 (913) 340-55-66', 6);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={640}
      centered
      footer={null}
      styles={{ body: { padding: 0 } }}
      title={null}
    >
      {contextHolder}

      <div className="max-h-[78vh] overflow-y-auto no-scrollbar px-5 py-6 sm:px-7">
        <div className="mb-6">
          <span className="hud-label">Бронирование</span>
          <h3 className="font-display text-2xl sm:text-3xl font-medium text-ink mt-3 mb-1 leading-tight">
            Ваш <span className="italic text-neon">заказ</span>
          </h3>
          <p className="text-muted text-[13px]">
            Заполните форму — отдел продаж подтвердит заезд и расскажет про оплату.
          </p>
        </div>

        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          initialValues={{
            rateId: initialRateId,
            roomTypeId: initialRoomTypeId,
            hasExtraGuest: 'no',
            extraGuests: 1,
            nights: DEFAULT_NIGHTS,
          }}
          onFinish={handleFinish}
        >
          {/* ---------- Заказ: тариф, номер, сумма за сутки ---------- */}
          <div className="hud glass rounded-2xl p-4 sm:p-5 mb-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <Form.Item
                name="rateId"
                label={<span className="text-muted text-xs">Период заезда</span>}
                className="mb-3"
              >
                <Select
                  size="large"
                  className="!rounded-xl"
                  options={RATES.map((r) => ({
                    value: r.id,
                    label: `${r.period} — ${formatPrice(r.price)} р.`,
                  }))}
                />
              </Form.Item>

              <Form.Item
                name="roomTypeId"
                label={<span className="text-muted text-xs">Категория номера</span>}
                className="mb-3"
              >
                <Select
                  size="large"
                  className="!rounded-xl"
                  options={ROOM_TYPES.map((r) => ({
                    value: r.id,
                    label: roomTypeLabel(r),
                  }))}
                />
              </Form.Item>
            </div>

            <div className="flex items-baseline justify-between gap-4 pt-3 border-t border-line">
              <span className="text-[13px] text-muted">
                {roomTypeLabel(room)}
                <span className="block text-[11px] text-muted/60 mt-0.5">
                  {rate.period} · питание и процедуры включены
                </span>
              </span>
              <span className="font-display italic text-2xl font-semibold text-ink whitespace-nowrap">
                {formatPrice(rate.price)}
                <span className="text-base not-italic text-muted ml-1">р.</span>
              </span>
            </div>

            {guests > 0 && (
              <div className="flex items-baseline justify-between gap-4 mt-2.5 text-[13px]">
                <span className="text-muted">
                  Доп. гость × {guests}
                  <span className="block text-[11px] text-muted/60 mt-0.5">
                    {formatPrice(EXTRA_GUEST_PRICE)} р. за сутки
                  </span>
                </span>
                <span className="font-display italic text-xl text-warm whitespace-nowrap">
                  +{formatPrice(EXTRA_GUEST_PRICE * guests)}
                  <span className="text-sm not-italic text-muted ml-1">р.</span>
                </span>
              </div>
            )}

            <div className="flex items-baseline justify-between gap-4 mt-3.5 pt-3 border-t border-line">
              <span className="font-mono-hud text-[11px] text-muted">Сумма за сутки</span>
              <span className="font-display italic text-2xl font-semibold text-neon whitespace-nowrap">
                {formatPrice(perNight)}
                <span className="text-base not-italic text-muted ml-1">р.</span>
              </span>
            </div>
          </div>

          {/* ---------- Гость ---------- */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Form.Item
              name="name"
              label={<span className="text-muted text-xs">Ваше имя</span>}
              rules={[{ required: true, message: 'Введите имя' }]}
            >
              <Input size="large" placeholder="Иван" className="!rounded-xl" autoComplete="given-name" />
            </Form.Item>
            <Form.Item
              name="surname"
              label={<span className="text-muted text-xs">Ваша фамилия</span>}
              rules={[{ required: true, message: 'Введите фамилию' }]}
            >
              <Input size="large" placeholder="Иванов" className="!rounded-xl" autoComplete="family-name" />
            </Form.Item>
          </div>

          <Form.Item
            name="phone"
            label={<span className="text-muted text-xs">Ваш номер телефона</span>}
            rules={[
              { required: true, message: 'Введите номер телефона' },
              {
                validator: (_, value) =>
                  !value || isPhoneComplete(value)
                    ? Promise.resolve()
                    : Promise.reject(new Error('Номер не полон: нужно 10 цифр')),
              },
            ]}
          >
            <Input
              size="large"
              className="!rounded-xl"
              type="tel"
              prefix={<PhoneOutlined className="text-accent mr-1" />}
              addonBefore={<span className="font-semibold">+7</span>}
              placeholder="(913) 340-55-66"
              autoComplete="tel"
              onChange={(e) => form.setFieldValue('phone', formatPhone(e.target.value))}
            />
          </Form.Item>

          {/* ---------- Дополнительный гость ---------- */}
          <Form.Item
            name="hasExtraGuest"
            label={<span className="text-muted text-xs">Будет ли дополнительный гость?</span>}
            className="mb-3"
          >
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              className="booking-segment w-full"
              options={[
                { label: 'Нет', value: 'no' },
                { label: 'Да', value: 'yes' },
              ]}
            />
          </Form.Item>

          <Form.Item noStyle shouldUpdate={(prev, next) => prev.hasExtraGuest !== next.hasExtraGuest}>
            {({ getFieldValue }) =>
              getFieldValue('hasExtraGuest') === 'yes' ? (
                <Form.Item
                  name="extraGuests"
                  label={
                    <span className="text-muted text-xs flex items-center gap-1.5">
                      <UserAddOutlined className="text-accent" />
                      Сколько дополнительных гостей
                    </span>
                  }
                  rules={[{ required: true, message: 'Укажите количество' }]}
                >
                  <InputNumber size="large" min={1} max={MAX_EXTRA_GUESTS} className="!w-full !rounded-xl" />
                </Form.Item>
              ) : null
            }
          </Form.Item>

          {/* ---------- Даты ---------- */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Form.Item
              name="checkIn"
              label={
                <span className="text-muted text-xs flex items-center gap-1.5">
                  <CalendarOutlined className="text-accent" />
                  Дата предварительного заезда
                </span>
              }
              getValueFromEvent={(date: Dayjs | null) => (date ? date.format('YYYY-MM-DD') : '')}
              getValueProps={(value: string) => ({ value: value ? dayjs(value) : null })}
              rules={[{ required: true, message: 'Выберите дату заезда' }]}
            >
              <DatePicker
                size="large"
                className="!w-full !rounded-xl"
                disabledDate={(current) => !!current && current < dayjs().startOf('day')}
                placeholder="Дд.ММ.ГГГГ"
              />
            </Form.Item>

            <Form.Item
              name="nights"
              label={
                <span className="text-muted text-xs flex items-center gap-1.5">
                  <MoonOutlined className="text-accent" />
                  Количество дней
                </span>
              }
              rules={[{ required: true, message: 'Укажите количество дней' }]}
            >
              <InputNumber
                size="large"
                min={1}
                max={MAX_NIGHTS}
                className="!w-full !rounded-xl"
                addonAfter={pluralNights(nights)}
              />
            </Form.Item>
          </div>

          <Form.Item name="comment" label={<span className="text-muted text-xs">Ваш комментарий</span>}>
            <TextArea
              rows={3}
              placeholder="Пожелания по размещению, процедуры, дни рождения…"
              className="!rounded-xl resize-none"
            />
          </Form.Item>

          <Form.Item
            name="consent"
            valuePropName="checked"
            rules={[
              {
                validator: (_, checked) =>
                  checked
                    ? Promise.resolve()
                    : Promise.reject(new Error('Нужно согласие на обработку данных')),
              },
            ]}
            className="mb-5"
          >
            <Checkbox className="text-[12.5px] leading-relaxed text-muted">
              Я даю согласие на обработку персональных данных в соответствии с{' '}
              <a
                href="https://cheder.ru/privacy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent underline decoration-accent/40 underline-offset-2 hover:text-accent-2"
                onClick={(e) => e.stopPropagation()}
              >
                политикой конфиденциальности
              </a>
            </Checkbox>
          </Form.Item>

          {/* ---------- Итого ---------- */}
          <div className="hud glass-strong rounded-2xl p-4 sm:p-5">
            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="font-mono-hud text-[11px] text-muted">Итого</div>
                <div className="text-[11px] text-muted/60 mt-1">
                  {nights} {pluralNights(nights)}
                  {guests > 0 ? ` · доп. гости ${guests}` : ''} · предоплата 100%
                </div>
              </div>
              <div className="font-display italic text-3xl sm:text-[34px] font-semibold text-neon leading-none whitespace-nowrap">
                {formatPrice(total)}
                <span className="text-lg not-italic text-muted ml-1.5">р.</span>
              </div>
            </div>

            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={submitting}
              icon={<CheckOutlined />}
              className="!mt-4 !h-12 !rounded-full !border-0 !bg-gradient-to-r !from-[#fdf6e7] !via-[#c9f2e2] !to-[#7cd9be] !text-[#0b231b] !font-semibold !text-[15px] !shadow-[0_8px_32px_rgba(124,217,190,0.25)] hover:!shadow-[0_14px_44px_rgba(124,217,190,0.4)] hover:-translate-y-0.5 transition-all duration-300"
            >
              Отправить заявку
            </Button>

            <div className="flex items-start gap-2 mt-3 text-[11px] text-muted/70">
              <SafetyOutlined className="text-accent/70 mt-0.5 shrink-0" />
              <span>
                Данные используются только для подтверждения брони. Оператор звонит в
                рабочее время: Пн–Пт 9:00–18:00.
              </span>
            </div>
          </div>
        </Form>
      </div>
    </Modal>
  );
}