'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Checkbox,
  DatePicker,
  Form,
  Input,
  Modal,
  Select,
  message,
} from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import {
  CalendarOutlined,
  CheckOutlined,
  IdcardOutlined,
  PhoneOutlined,
  SafetyOutlined,
  TeamOutlined,
  UserAddOutlined,
} from '@ant-design/icons';
import {
  DEFAULT_RATE_ID,
  DEFAULT_ROOM_TYPE_ID,
  EXTRA_GUEST_PRICE,
  MAX_GUESTS,
  MAX_NIGHTS,
  RATES,
  ROOM_TYPES,
  calcTotal,
  findRate,
  findRoomType,
  formatPhone,
  formatPrice,
  isPhoneComplete,
  nightsBetweenDates,
  phoneToE164,
  pluralGuests,
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

/** Пустой гость: первый в списке заполняет форму, остальные — спутники */
function emptyGuest() {
  return { surname: '', name: '', patronymic: '', phone: '', passport: '' };
}

/** Значение DatePicker ↔ ISO-строка 'YYYY-MM-DD' (в API и заявке — именно она) */
const isoProps = {
  getValueFromEvent: (date: Dayjs | null) => (date ? date.format('YYYY-MM-DD') : ''),
  getValueProps: (value: string) => ({ value: value ? dayjs(value) : null }),
};

const labelClass = 'text-muted text-xs';

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
  const checkIn = Form.useWatch('checkIn', form);
  const checkOut = Form.useWatch('checkOut', form);
  const guests = Form.useWatch('guests', form) ?? [];

  const rate = useMemo(() => findRate(rateId), [rateId]);
  const room = useMemo(() => findRoomType(roomTypeId), [roomTypeId]);

  const nights = checkIn && checkOut ? nightsBetweenDates(checkIn, checkOut) : DEFAULT_NIGHTS;
  // Первый гость — основной, каждый следующий считается доплатой за сутки
  const extraGuests = Math.max(0, guests.length - 1);
  const perNight = pricePerNight(rate, extraGuests);
  const total = calcTotal(rate, nights, extraGuests);

  // При каждом открытии — актуальные тариф/категория и чистая форма
  useEffect(() => {
    if (!open) return;
    const today = dayjs().startOf('day');
    form.setFieldsValue({
      rateId: findRate(initialRateId).id,
      roomTypeId: findRoomType(initialRoomTypeId).id,
      checkIn: today.add(1, 'day').format('YYYY-MM-DD'),
      checkOut: today.add(1 + DEFAULT_NIGHTS, 'day').format('YYYY-MM-DD'),
      guests: [emptyGuest()],
    });
  }, [open, initialRateId, initialRoomTypeId, form]);

  const handleFinish = async (values: BookingFormValues) => {
    const chosenRate = findRate(values.rateId);
    const chosenRoom = findRoomType(values.roomTypeId);
    const nightsCount = nightsBetweenDates(values.checkIn, values.checkOut);
    const extra = Math.max(0, values.guests.length - 1);

    setSubmitting(true);
    try {
      await submitBooking({
        rateId: values.rateId,
        ratePeriod: chosenRate.period,
        roomTypeId: values.roomTypeId,
        roomTypeLabel: roomTypeLabel(chosenRoom),
        checkIn: values.checkIn,
        checkOut: values.checkOut,
        nights: nightsCount,
        guests: values.guests.map((guest) => ({
          ...guest,
          phone: guest.phone ? phoneToE164(guest.phone) || guest.phone : undefined,
        })),
        phone: phoneToE164(values.guests[0]?.phone ?? '') || values.guests[0]?.phone || '',
        comment: values.comment,
        consent: values.consent,
        pricePerNight: pricePerNight(chosenRate, extra),
        extraGuestsPrice: EXTRA_GUEST_PRICE * extra,
        total: calcTotal(chosenRate, nightsCount, extra),
        submittedAt: new Date().toISOString(),
        source,
      });
      messageApi.success('Заявка отправлена! Мы свяжемся с вами в течение рабочего дня.', 5);
      onClose();
    } catch (error) {
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
      width={680}
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
            guests: [emptyGuest()],
          }}
          onFinish={handleFinish}
        >
          {/* ---------- Заказ: тариф, номер, сумма за сутки ---------- */}
          <div className="hud glass rounded-2xl p-4 sm:p-5 mb-6">
            <div className="grid sm:grid-cols-2 gap-4">
              <Form.Item name="rateId" label={<span className={labelClass}>Период заезда</span>} className="mb-3">
                <Select
                  size="large"
                  className="!rounded-xl"
                  options={RATES.map((r) => ({
                    value: r.id,
                    label: `${r.period} — ${formatPrice(r.price)} р.`,
                  }))}
                />
              </Form.Item>

              <Form.Item name="roomTypeId" label={<span className={labelClass}>Категория номера</span>} className="mb-3">
                <Select
                  size="large"
                  className="!rounded-xl"
                  options={ROOM_TYPES.map((r) => ({ value: r.id, label: roomTypeLabel(r) }))}
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

            {extraGuests > 0 && (
              <div className="flex items-baseline justify-between gap-4 mt-2.5 text-[13px]">
                <span className="text-muted">
                  Доп. гости × {extraGuests}
                  <span className="block text-[11px] text-muted/60 mt-0.5">
                    {formatPrice(EXTRA_GUEST_PRICE)} р. за сутки за каждого
                  </span>
                </span>
                <span className="font-display italic text-xl text-gradient-warm whitespace-nowrap">
                  +{formatPrice(EXTRA_GUEST_PRICE * extraGuests)}
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

          {/* ---------- Даты заезда и выезда ---------- */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Form.Item
              name="checkIn"
              label={
                <span className={`${labelClass} flex items-center gap-1.5`}>
                  <CalendarOutlined className="text-accent" />
                  Дата заселения
                </span>
              }
              {...isoProps}
              rules={[{ required: true, message: 'Выберите дату заселения' }]}
            >
              <DatePicker
                size="large"
                className="!w-full !rounded-xl"
                disabledDate={(current) => !!current && current < dayjs().startOf('day')}
                placeholder="Дд.Мм.ГГГГ"
              />
            </Form.Item>

            <Form.Item
              name="checkOut"
              label={
                <span className={`${labelClass} flex items-center gap-1.5`}>
                  <CalendarOutlined className="text-accent" />
                  Дата выезда
                </span>
              }
              {...isoProps}
              rules={[
                { required: true, message: 'Выберите дату выезда' },
                {
                  validator: (_, value: string) => {
                    const start = form.getFieldValue('checkIn') as string | undefined;
                    if (!value || !start) return Promise.resolve();
                    return Date.parse(value) > Date.parse(start)
                      ? Promise.resolve()
                      : Promise.reject(new Error('Выезд должен быть позже заселения'));
                  },
                },
                {
                  validator: (_, value: string) => {
                    const start = form.getFieldValue('checkIn') as string | undefined;
                    if (!value || !start) return Promise.resolve();
                    return nightsBetweenDates(start, value) <= MAX_NIGHTS
                      ? Promise.resolve()
                      : Promise.reject(new Error(`Не больше ${MAX_NIGHTS} дней`));
                  },
                },
              ]}
            >
              <DatePicker
                size="large"
                className="!w-full !rounded-xl"
                disabledDate={(current) => {
                  const start = form.getFieldValue('checkIn') as string | undefined;
                  if (!current) return false;
                  if (current < dayjs().startOf('day')) return true;
                  return start ? !current.isAfter(dayjs(start), 'day') : false;
                }}
                placeholder="Дд.ММ.ГГГГ"
              />
            </Form.Item>
          </div>

          <div className="text-[12px] text-muted -mt-1 mb-5 flex items-center gap-1.5">
            <TeamOutlined className="text-accent/70" />
            {nights} {pluralNights(nights)} · {guests.length} {pluralGuests(guests.length)}
          </div>

          {/* ---------- Гости: ФИО и паспортные данные ---------- */}
          <Form.List
            name="guests"
            rules={[
              {
                validator: (_, value) =>
                  value?.length > 0
                    ? Promise.resolve()
                    : Promise.reject(new Error('Добавьте хотя бы одного гостя')),
              },
            ]}
          >
            {(fields, { add, remove }, { errors }) => (
              <>
                {fields.map((field, index) => (
                  <div key={field.key} className="hud glass rounded-2xl p-4 sm:p-5 mb-4">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <span className="font-mono-hud text-[11px] text-muted">
                        {index === 0 ? 'ОСНОВНОЙ ГОСТЬ' : `ГОСТЬ ${index + 1}`}
                      </span>
                      {index > 0 && (
                        <Button size="small" type="text" danger onClick={() => remove(field.name)}>
                          Убрать
                        </Button>
                      )}
                    </div>

                    <div className="grid sm:grid-cols-3 gap-3">
                      <Form.Item
                        name={[field.name, 'surname']}
                        label={<span className={labelClass}>Фамилия</span>}
                        rules={[{ required: true, message: 'Введите фамилию' }]}
                        className="mb-2"
                      >
                        <Input size="large" placeholder="Иванов" className="!rounded-xl" autoComplete="family-name" />
                      </Form.Item>
                      <Form.Item
                        name={[field.name, 'name']}
                        label={<span className={labelClass}>Имя</span>}
                        rules={[{ required: true, message: 'Введите имя' }]}
                        className="mb-2"
                      >
                        <Input size="large" placeholder="Иван" className="!rounded-xl" autoComplete="given-name" />
                      </Form.Item>
                      <Form.Item
                        name={[field.name, 'patronymic']}
                        label={<span className={labelClass}>Отчество</span>}
                        rules={index === 0 ? [{ required: true, message: 'Введите отчество' }] : undefined}
                        className="mb-2"
                      >
                        <Input size="large" placeholder="Иванович" className="!rounded-xl" />
                      </Form.Item>
                    </div>

                    {index === 0 && (
                      <Form.Item
                        name={[field.name, 'phone']}
                        label={<span className={labelClass}>Номер телефона</span>}
                        rules={[
                          { required: true, message: 'Введите номер телефона' },
                          {
                            validator: (_, value) =>
                              !value || isPhoneComplete(value)
                                ? Promise.resolve()
                                : Promise.reject(new Error('Номер не полон: нужно 10 цифр')),
                          },
                        ]}
                        className="mb-2"
                      >
                        <Input
                          size="large"
                          className="!rounded-xl"
                          type="tel"
                          prefix={<PhoneOutlined className="text-accent mr-1" />}
                          addonBefore={<span className="font-semibold">+7</span>}
                          placeholder="(913) 340-55-66"
                          autoComplete="tel"
                          onChange={(e) =>
                            form.setFieldValue(['guests', field.name, 'phone'], formatPhone(e.target.value))
                          }
                        />
                      </Form.Item>
                    )}

                    <Form.Item
                      name={[field.name, 'passport']}
                      label={
                        <span className={`${labelClass} flex items-center gap-1.5`}>
                          <IdcardOutlined className="text-accent" />
                          Серия и номер паспорта
                        </span>
                      }
                      rules={index === 0 ? [{ required: true, message: 'Введите серию и номер паспорта' }] : undefined}
                      className="mb-2"
                    >
                      <Input size="large" placeholder="65 12 №123456" className="!rounded-xl" />
                    </Form.Item>

                    {index === 0 && (
                      <div className="grid sm:grid-cols-2 gap-3">
                        <Form.Item
                          name={[field.name, 'passportIssuedBy']}
                          label={<span className={labelClass}>Кем выдан</span>}
                          className="mb-2"
                        >
                          <Input size="large" placeholder="ОВД Кировского района" className="!rounded-xl" />
                        </Form.Item>
                        <Form.Item
                          name={[field.name, 'passportIssuedDate']}
                          label={<span className={labelClass}>Дата выдачи</span>}
                          {...isoProps}
                          className="mb-2"
                        >
                          <DatePicker
                            size="large"
                            className="!w-full !rounded-xl"
                            placeholder="Дд.ММ.ГГГГ"
                            disabledDate={(current) => !!current && current > dayjs().endOf('day')}
                          />
                        </Form.Item>
                        <Form.Item
                          name={[field.name, 'address']}
                          label={<span className={labelClass}>Адрес регистрации</span>}
                          className="mb-2 sm:col-span-2"
                        >
                          <Input size="large" placeholder="г. Кызыл, ул. Ленина, д. 1, кв. 1" className="!rounded-xl" />
                        </Form.Item>
                      </div>
                    )}
                  </div>
                ))}

                {fields.length < MAX_GUESTS && (
                  <Button
                    type="dashed"
                    size="large"
                    block
                    icon={<UserAddOutlined />}
                    onClick={() => add(emptyGuest())}
                    className="!rounded-xl !h-11 !mb-2"
                  >
                    Добавить гостя
                  </Button>
                )}
                <div className="text-[11px] text-muted/60 mb-5">
                  Доплата за каждого следующего гостя — {formatPrice(EXTRA_GUEST_PRICE)} р. в сутки. Не больше{' '}
                  {MAX_GUESTS} {pluralGuests(MAX_GUESTS)} в одной заявке.
                </div>
                <Form.ErrorList errors={errors} />
              </>
            )}
          </Form.List>

          <Form.Item name="comment" label={<span className={labelClass}>Ваш комментарий</span>}>
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
              Я даю согласие на обработку персональных данных, включая паспортные, в соответствии с{' '}
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
                  {extraGuests > 0 ? ` · доп. гости ${extraGuests}` : ''} · предоплата 100%
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
              className="!mt-4 !h-12 !rounded-full !border-0 !bg-gradient-to-r !from-[#fffdf6] !via-[#f0e9d8] !to-[#ddd0b0] !text-[#241a08] !font-semibold !text-[15px] !shadow-[0_8px_32px_rgba(224,212,182,0.25)] hover:!shadow-[0_14px_44px_rgba(224,212,182,0.4)] hover:-translate-y-0.5 transition-all duration-300"
            >
              Отправить заявку
            </Button>

            <div className="flex items-start gap-2 mt-3 text-[11px] text-muted/70">
              <SafetyOutlined className="text-accent/70 mt-0.5 shrink-0" />
              <span>
                Данные используются только для оформления брони в санатории. Оператор звонит в
                рабочее время: Пн–Пт 9:00–18:00.
              </span>
            </div>
          </div>
        </Form>
      </div>
    </Modal>
  );
}
