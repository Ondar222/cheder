'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Alert,
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Select,
  Space,
  Typography,
  message,
} from 'antd';
import { MinusCircleOutlined, PlusOutlined, ThunderboltOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import { describeApiError } from '@/lib/api';
import { createBooking, fetchBookingGrid, GRID_LOOKBACK_DAYS, type GridBooking, type GridRoom } from '@/lib/bookingApi';
import { formatPrice } from '@/lib/booking';
import { formatDate, nightsBetween, toUnix } from '@/lib/datetime';
import { readLeads, updateLead } from '@/lib/leads';

type FormValues = {
  checkIn: Dayjs;
  nights: number;
  roomId: number;
  capacity: number;
  guests: {
    surname: string;
    name: string;
    patronymic?: string;
    phone?: string;
    email?: string;
  }[];
  comment?: string;
};

/** Комната занята, если её бронь пересекается с [checkIn, checkOut) */
function isRoomBusy(roomId: number, bookings: GridBooking[], checkIn: number, checkOut: number): boolean {
  return bookings.some(
    (booking) =>
      booking.roomId === roomId &&
      !/CANCEL/i.test(booking.status) &&
      booking.checkIn < checkOut &&
      checkIn < booking.checkOut,
  );
}

/**
 * Создание брони в Yurta из заявки или вручную.
 *
 * Свободные комнаты считаем из той же решётки /v4/booking/grid, что и список
 * броней: менеджер не сможет посадить двух гостей в один номер, потому что
 * занятые на выбранные даты комнаты просто не попадут в выбор.
 */
export default function CreateBookingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const leadId = searchParams.get('lead');

  const [form] = Form.useForm<FormValues>();
  const [messageApi, contextHolder] = message.useMessage();

  const [rooms, setRooms] = useState<GridRoom[]>([]);
  const [bookings, setBookings] = useState<GridBooking[]>([]);
  const [loadedPeriod, setLoadedPeriod] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [roomsError, setRoomsError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const checkIn = Form.useWatch('checkIn', form);
  const nights = Form.useWatch('nights', form);

  // Заявка из /admin: readLeads безопасен на сервере, поэтому её можно прочитать
  // прямо на рендере — эффект подState только заполняет поля формы.
  const lead = useMemo(() => {
    if (!leadId) return null;
    return readLeads().find((item) => item.leadId === leadId) ?? null;
  }, [leadId]);

  const period = useMemo(() => {
    if (!checkIn) return null;
    const start = toUnix(dayjs(checkIn).startOf('day'));
    const end = start + Math.max(1, nights ?? 1) * 86_400;
    return { checkIn: start, checkOut: end };
  }, [checkIn, nights]);

  const periodKey = period ? `${period.checkIn}:${period.checkOut}` : null;

  useEffect(() => {
    if (!lead) return;
    form.setFieldsValue({
      checkIn: dayjs(lead.checkIn),
      nights: lead.nights,
      capacity: 1 + (lead.hasExtraGuest === 'yes' ? lead.extraGuests ?? 1 : 0),
      guests: [{ surname: lead.surname, name: lead.name }],
      comment: lead.comment
        ? `Заявка с сайта (${lead.source}): ${lead.comment}`
        : `Заявка с сайта (${lead.source})`,
    });
  }, [lead, form]);

  useEffect(() => {
    if (!period || !periodKey) return;

    // Решётка берётся с запасом: сзади — чтобы увидеть заезды, которые уже идут
    // (сервер отбирает брони по дате заезда, см. GRID_LOOKBACK_DAYS), спереди —
    // чтобы видеть брони, кончающиеся в день заезда. Иначе форма предложила бы
    // занятый номер. Состояния меняем только в колбэках.
    fetchBookingGrid({
      checkIn: period.checkIn - GRID_LOOKBACK_DAYS * 86_400,
      checkOut: period.checkOut + 7 * 86_400,
    })
      .then((grid) => {
        setRooms(grid.rooms);
        setBookings(grid.bookings);
        setRoomsError(null);
        setLoadedPeriod(periodKey);
      })
      .catch((error: unknown) => setRoomsError(describeApiError(error)));
  }, [period, periodKey, reloadToken]);

  const roomsLoading = periodKey !== null && loadedPeriod !== periodKey;

  const options = useMemo(() => {
    if (!period) return [];
    return rooms.map((room) => {
      const busy = isRoomBusy(room.id, bookings, period.checkIn, period.checkOut);
      return {
        value: room.id,
        disabled: busy,
        label: (
          <div className="flex items-center justify-between gap-3">
            <span>
              № {room.number || room.name}
              <span className="text-muted ml-2 text-[12px]">
                {room.roomTypeName || room.buildingName || ''} · до {room.capacity} гост.
              </span>
            </span>
            <span className={busy ? 'text-warm text-[12px]' : 'text-accent text-[12px]'}>
              {busy ? 'занята' : `${formatPrice(room.price)} р.`}
            </span>
          </div>
        ),
      };
    });
  }, [rooms, bookings, period]);

  const handleFinish = async (values: FormValues) => {
    const checkInUnix = toUnix(values.checkIn.startOf('day'));
    const totalNights = Math.max(1, values.nights ?? 1);

    setSubmitting(true);
    try {
      const bookingId = await createBooking({
        checkIn: checkInUnix,
        checkOut: checkInUnix + totalNights * 86_400,
        roomIds: [values.roomId],
        capacity: values.capacity ?? values.guests.length ?? 1,
        guests: values.guests,
        comment: values.comment,
      });

      if (lead && bookingId) updateLead(lead.leadId, { status: 'booked', bookingId });

      messageApi.success(
        bookingId ? `Бронь #${bookingId} создана` : 'Бронь создана',
        4,
      );
      router.push(lead ? '/admin' : '/admin/bookings');
    } catch (error) {
      messageApi.error(describeApiError(error), 6);
    } finally {
      setSubmitting(false);
    }
  };

  const periodHint = period
    ? `${formatDate(period.checkIn)} — ${formatDate(period.checkOut)}, ${nightsBetween(period.checkIn, period.checkOut)} ноч.`
    : 'Выберите дату заезда';

  return (
    <div className="max-w-3xl">
      {contextHolder}

      <div className="mb-7">
        <span className="hud-label">Платформа Yurta</span>
        <h1 className="font-display text-3xl sm:text-4xl font-medium text-ink mt-3 mb-1.5 leading-tight">
          Новое <span className="italic text-neon">бронирование</span>
        </h1>
        <p className="text-muted text-[13px]">
          Бронь создаётся со статусом «не оплачен»: предоплату 100% и договор
          менеджер оформляет в партнёрском кабинете.
        </p>
      </div>

      {lead && (
        <Alert
          type="info"
          showIcon
          icon={<ThunderboltOutlined />}
          message={`Заявка: ${lead.surname} ${lead.name}, заезд ${formatDate(lead.checkIn)}, ${lead.nights} ноч.`}
          description={`Сумма по заявке на сайте — ${formatPrice(lead.total)} р. (${lead.roomTypeLabel}). После создания брони заявка отметится как взятая в работу.`}
          className="!mb-6 !rounded-xl"
        />
      )}

      {leadId && !lead && (
        <Alert
          type="warning"
          showIcon
          message="Заявка не найдена в этом браузере"
          description="Создайте бронь вручную — форма заполнена с нуля."
          className="!mb-6 !rounded-xl"
        />
      )}

      {roomsError && (
        <Alert
          type="warning"
          showIcon
          message="Комнаты не загрузились"
          description={`${roomsError}. Проверьте вход и доступ к отелю в Yurta.`}
          className="!mb-6 !rounded-xl"
          action={
            <Button size="small" onClick={() => setReloadToken((value) => value + 1)}>
              Повторить
            </Button>
          }
        />
      )}

      <div className="glass-strong hud rounded-2xl p-5 sm:p-7">
        <Form
          form={form}
          layout="vertical"
          requiredMark={false}
          onFinish={handleFinish}
          initialValues={{
            checkIn: dayjs().add(1, 'day').startOf('day'),
            nights: 3,
            capacity: 1,
            guests: [{ surname: '', name: '' }],
          }}
        >
          <div className="grid sm:grid-cols-3 gap-4">
            <Form.Item
              name="checkIn"
              label={<span className="text-muted text-xs">Дата заезда</span>}
              rules={[{ required: true, message: 'Выберите дату' }]}
            >
              <DatePicker
                size="large"
                className="!w-full !rounded-xl"
                disabledDate={(current) => !!current && current < dayjs().startOf('day')}
              />
            </Form.Item>

            <Form.Item
              name="nights"
              label={<span className="text-muted text-xs">Ночей</span>}
              rules={[{ required: true, message: 'Укажите количество' }]}
            >
              <InputNumber size="large" min={1} max={60} className="!w-full !rounded-xl" />
            </Form.Item>

            <Form.Item
              name="capacity"
              label={<span className="text-muted text-xs">Гостей</span>}
              rules={[{ required: true, message: 'Укажите количество' }]}
            >
              <InputNumber size="large" min={1} max={10} className="!w-full !rounded-xl" />
            </Form.Item>
          </div>

          <div className="text-[12px] text-muted mb-4 -mt-1">{periodHint}</div>

          <Form.Item
            name="roomId"
            label={<span className="text-muted text-xs">Комната</span>}
            rules={[{ required: true, message: 'Выберите комнату' }]}
            extra={
              period
                ? 'Занятые на эти даты комнаты недоступны для выбора'
                : undefined
            }
          >
            <Select
              size="large"
              className="!rounded-xl"
              placeholder={rooms.length === 0 ? 'Комнаты ещё не загрузились' : 'Выберите свободную комнату'}
              loading={roomsLoading}
              options={options}
            />
          </Form.Item>

          <Form.List
            name="guests"
            rules={[
              {
                validator: (_, guests) =>
                  guests?.length > 0 ? Promise.resolve() : Promise.reject(new Error('Добавьте хотя бы одного гостя')),
              },
            ]}
          >
            {(fields, { add, remove }, { errors }) => (
              <>
                <div className="text-muted text-xs mb-2">Гости</div>
                {fields.map((field) => (
                  <div key={field.key} className="grid sm:grid-cols-[1fr_1fr_1fr_auto] gap-3 mb-1 items-start">
                    <Form.Item
                      name={[field.name, 'surname']}
                      rules={[{ required: true, message: 'Фамилия' }]}
                    >
                      <Input size="large" placeholder="Фамилия" className="!rounded-xl" />
                    </Form.Item>
                    <Form.Item
                      name={[field.name, 'name']}
                      rules={[{ required: true, message: 'Имя' }]}
                    >
                      <Input size="large" placeholder="Имя" className="!rounded-xl" />
                    </Form.Item>
                    <Form.Item name={[field.name, 'phone']}>
                      <Input size="large" placeholder="Телефон" className="!rounded-xl" />
                    </Form.Item>
                    <Button
                      size="large"
                      type="text"
                      danger
                      icon={<MinusCircleOutlined />}
                      disabled={fields.length === 1}
                      onClick={() => remove(field.name)}
                      aria-label="Убрать гостя"
                    />
                    <Form.Item name={[field.name, 'patronymic']} className="sm:col-span-2">
                      <Input size="large" placeholder="Отчество" className="!rounded-xl" />
                    </Form.Item>
                    <Form.Item name={[field.name, 'email']} className="sm:col-span-2">
                      <Input size="large" type="email" placeholder="Email" className="!rounded-xl" />
                    </Form.Item>
                    <div className="hidden sm:block" />
                  </div>
                ))}

                <Space className="mb-5">
                  <Button type="dashed" icon={<PlusOutlined />} onClick={() => add({ surname: '', name: '' })}>
                    Добавить гостя
                  </Button>
                  <Typography.Text type="secondary" className="!text-[12px]">
                    Паспортные данные — в партнёрском кабинете при заселении
                  </Typography.Text>
                </Space>
                <Form.ErrorList errors={errors} />
              </>
            )}
          </Form.List>

          <Form.Item name="comment" label={<span className="text-muted text-xs">Комментарий</span>}>
            <Input.TextArea rows={3} placeholder="Пожелания, процедуры, оплата" className="!rounded-xl resize-none" />
          </Form.Item>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={submitting}
              disabled={rooms.length === 0}
              className="!h-12 !px-8 !rounded-full !border-0 !bg-gradient-to-r !from-[#fffdf6] !via-[#f0e9d8] !to-[#ddd0b0] !text-[#241a08] !font-semibold"
            >
              Создать бронь
            </Button>
            <Button size="large" onClick={() => router.back()} className="!h-12 !rounded-full">
              Отмена
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}
