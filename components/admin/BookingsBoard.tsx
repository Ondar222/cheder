'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, DatePicker, Input, Popconfirm, Select, Space, Statistic, Table, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import {
  ExclamationCircleOutlined,
  HomeOutlined,
  ReloadOutlined,
  SearchOutlined,
  ThunderboltOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import { describeApiError } from '@/lib/api';
import {
  GRID_LOOKBACK_DAYS,
  bookingStatusLabel,
  deleteBooking,
  fetchBookingGrid,
  isCancelledStay,
  isGuestInHouse,
  stayOverlapsWindow,
  type GridBooking,
  type GridRoom,
} from '@/lib/bookingApi';
import { formatDate, nightsBetween, toUnix } from '@/lib/datetime';
import { formatPrice } from '@/lib/booking';
import { fetchLeads, type SiteLead } from '@/lib/leads';

const { RangePicker } = DatePicker;

/** Значение фильтра «живут сейчас» в Select статусов: настоящего статуса с таким id нет */
const IN_HOUSE_FILTER = '__in_house';

/** Быстрые окна: менеджеру нужно и «что было», и «что впереди» */
const PERIOD_PRESETS: { label: string; value: [Dayjs, Dayjs] }[] = [
  { label: 'Сегодня', value: [dayjs().startOf('day'), dayjs().startOf('day')] },
  { label: 'Неделя', value: [dayjs().startOf('day'), dayjs().add(6, 'day').startOf('day')] },
  { label: 'Две недели', value: [dayjs().startOf('day'), dayjs().add(13, 'day').startOf('day')] },
  { label: 'Месяц', value: [dayjs().startOf('day'), dayjs().add(29, 'day').startOf('day')] },
  { label: 'Квартал', value: [dayjs().startOf('day'), dayjs().add(89, 'day').startOf('day')] },
  { label: 'Полгода', value: [dayjs().startOf('day'), dayjs().add(179, 'day').startOf('day')] },
  { label: 'Год', value: [dayjs().startOf('day'), dayjs().add(364, 'day').startOf('day')] },
  { label: 'Этот месяц', value: [dayjs().startOf('month'), dayjs().endOf('month').startOf('day')] },
  { label: 'Прошедший месяц', value: [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month').startOf('day')] },
];

/**
 * Окно по умолчанию — квартал вперёд.
 *
 * Бронь с другого сайта или из партнёрского кабинета ставится и на дальние
 * даты: узкое окно «сегодня — +14 дней» показывало бы список пустым, хотя заезд
 * уже создан, и менеджер решил бы, что бронь не дошла.
 */
const DEFAULT_PERIOD_DAYS = 90;

/** Синтетический id для lead-брони: отрицательный, чтобы не конфликтовал с Yurta */
function leadSyntheticId(lead: SiteLead): number {
  return -(lead.bookingId ?? 0);
}

/**
 * Заявка → GridBooking, чтобы показать её в той же таблице.
 * roomId = 0 — комнату заявка не хранит, это приёмлемо: комната под заявку
 * подбирается на сервере и видна только в Yurta.
 * Статус берётся из заявки: если «В броне» → NEW, иначе → DRAFT.
 */
function leadAsGridBooking(lead: SiteLead): GridBooking {
  return {
    id: lead.bookingId ?? leadSyntheticId(lead),
    roomId: 0,
    checkIn: toUnix(lead.checkIn),
    checkOut: toUnix(lead.checkOut),
    status: lead.status === 'booked' ? 'NEW' : 'DRAFT',
    totalAmount: lead.total,
    comment: lead.comment ?? '',
    guests: (lead.guests ?? []).map((g) => ({
      surname: g.surname,
      name: g.name,
      patronymic: g.patronymic,
      phone: g.phone,
      additionalInfo: g.passport,
    })),
  };
}

/** Цвет статуса — та же логика, что подсветка в шахматке партнёрского кабинета */
function statusColor(status: string): string {
  if (/PAID/i.test(status) && !/UNPAID/i.test(status)) return 'green';
  if (/CHECKED_IN|IN_HOUSE/i.test(status)) return 'blue';
  if (/CANCEL/i.test(status)) return 'red';
  return 'gold';
}

/**
 * Брони санатория из Yurta за выбранный период + брони из заявок с сайта.
 *
 * Источник броней отеля — решётка /v4/booking/grid: она отдаёт и комнаты, и все
 * брони, поэтому одного запроса хватает и на таблицу, и на счётчики загрузки.
 * Брони из заявок (leads) добавляются отдельно: сервер создаёт их под сервисным
 * аккаунтом, и если аккаунт менеджера видит их в решётке — дедупликация по id
 * уберёт дубль; если не видит — бронь с сайта всё равно будет в списке.
 */
export default function BookingsBoard() {
  const [period, setPeriod] = useState<[Dayjs, Dayjs]>(() => [
    dayjs().startOf('day'),
    dayjs().add(DEFAULT_PERIOD_DAYS - 1, 'day').startOf('day'),
  ]);
  const [rooms, setRooms] = useState<GridRoom[]>([]);
  const [bookings, setBookings] = useState<GridBooking[]>([]);
  const [siteLeads, setSiteLeads] = useState<SiteLead[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<string>('all');
  const [rawMeta, setRawMeta] = useState<{ rooms: number; bookings: number } | null>(null);

  // Все переходы состояний — в колбэках промиса: синхронный setState внутри
  // эффекта дал бы каскадный рендер на каждую смену периода.
  const load = useCallback(() => {
    // Запрашиваем с запасом назад, иначе уже идущие заезды (гость заселён
    // раньше начала окна) в решётку не попадут — см. GRID_LOOKBACK_DAYS
    fetchBookingGrid({
      checkIn: toUnix(period[0].subtract(GRID_LOOKBACK_DAYS, 'day')),
      checkOut: toUnix(period[1]),
    })
      .then((grid) => {
        console.log('[bookings-grid] получено:', {
          rooms: grid.rooms.length,
          bookings: grid.bookings.length,
          sample: grid.bookings.slice(0, 3).map((b: GridBooking) => ({
            id: b.id,
            roomId: b.roomId,
            status: b.status,
            checkInRaw: b.checkIn,
            checkIn: formatDate(b.checkIn),
            checkOutRaw: b.checkOut,
            checkOut: formatDate(b.checkOut),
          })),
        });
        setRooms(grid.rooms);
        setBookings(grid.bookings);
        setRawMeta({ rooms: grid.rooms.length, bookings: grid.bookings.length });
        setError(null);
        setLoaded(true);
        setRefreshing(false);
      })
      .catch((err: unknown) => {
        console.error('[bookings-grid] ошибка:', err);
        setError(describeApiError(err));
        setLoaded(true);
        setRefreshing(false);
      });

    // Заявки со статусом «в броне» тянем параллельно: они могут быть не видны
    // в решётке менеджера (сервисный аккаунт ≠ аккаунт менеджера), но менеджер
    // обязан видеть каждую созданную бронь. Показываем все заявки, чтобы не
    // потерять бронь, если заявка ещё не переведена в статус «в броне».
    fetchLeads()
      .then(({ leads }) => setSiteLeads(leads))
      .catch(() => undefined);
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);

  const loading = !loaded;

  const roomById = useMemo(() => new Map(rooms.map((room) => [room.id, room])), [rooms]);

  /**
   * Брони из заявок, которых нет в решётке Yurta: сервисный аккаунт создал
   * бронь, а менеджер под своим логином её не видит (разные аккаунты отеля
   * или API ещё не ответил). Дедупликация по bookingId — если bookingId есть
   * и он уже в решётке, дубль не добавляем. Если bookingId нет — добавляем
   * всегда, потому что дубликата в решётке всё равно нет.
   */
  const mergedBookings = useMemo(() => {
    const gridIds = new Set(bookings.map((b) => b.id));
    const fromLeads = siteLeads
      .filter((lead) => !lead.bookingId || !gridIds.has(lead.bookingId))
      .map(leadAsGridBooking);
    return [...bookings, ...fromLeads];
  }, [bookings, siteLeads]);

  /** id синтетических броней из заявок — для пометки «с сайта» в таблице */
  const siteBookingIds = useMemo(
    () => new Set(siteLeads.filter((l) => !l.bookingId).map(leadSyntheticId)),
    [siteLeads],
  );

  /** Границы выбранного периода — только для превью в алертах ниже */
  const windowEdges = useMemo(
    () => ({ from: toUnix(period[0]), to: toUnix(period[1].add(1, 'day')) }),
    [period],
  );

  /** Все брони, полученные от API — показываем полностью, без фильтрации по дате */
  const allBookings = useMemo(() => mergedBookings, [mergedBookings]);

  const statuses = useMemo(
    () => Array.from(new Set(allBookings.map((booking) => booking.status))),
    [allBookings],
  );

  /** Сейчас в номерах */
  const inHouse = useMemo(() => mergedBookings.filter((booking) => !isCancelledStay(booking) && isGuestInHouse(booking)), [mergedBookings]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return allBookings
      .filter((booking) => {
        // Отдельный фильтр «живут сейчас»: статусы у них бывают разные
        if (status === IN_HOUSE_FILTER) {
          if (!isGuestInHouse(booking)) return false;
        } else if (status !== 'all' && booking.status !== status) {
          return false;
        }
        if (!needle) return true;
        const room = roomById.get(booking.roomId);
        const haystack = [
          ...booking.guests.flatMap((guest) => [
            guest.name,
            guest.surname,
            guest.patronymic,
            guest.phone,
            guest.additionalInfo,
          ]),
          room?.number,
          room?.name,
          String(booking.id),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(needle);
      })
      .sort((a, b) => a.checkIn - b.checkIn || a.roomId - b.roomId);
  }, [allBookings, query, status, roomById]);

  /** Комнаты, у которых есть активная бронь на сегодня */
  const occupancyToday = useMemo(() => {
    if (rooms.length === 0) return null;
    const occupied = new Set(inHouse.map((booking) => booking.roomId));
    return { occupied: occupied.size, total: rooms.length };
  }, [inHouse, rooms]);

  const unpaid = allBookings.filter((booking) => bookingStatusLabel(booking.status) === 'Не оплачен').length;

  const columns: TableColumnsType<GridBooking> = [
    {
      title: 'Бронь',
      key: 'id',
      width: 120,
      render: (_, booking) => {
        const isSiteBooking = siteBookingIds.has(booking.id);
        return (
          <div>
            <span className="font-mono-hud text-[11px] text-muted">
              #{booking.id > 0 ? booking.id : Math.abs(booking.id)}
            </span>
            {isSiteBooking && (
              <Tag
                icon={<ThunderboltOutlined />}
                color="cyan"
                className="!m-0 !ml-1 !px-1 !text-[10px] leading-[16px]"
              >
                сайт
              </Tag>
            )}
          </div>
        );
      },
    },
    {
      title: 'Гости',
      key: 'guests',
      render: (_, booking) => (
        <div>
          <div className="text-ink text-[13.5px]">
            {booking.guests.map((guest) => [guest.surname, guest.name].filter(Boolean).join(' ')).join(', ') || '—'}
          </div>
          <div className="text-[12px] text-muted">
            {booking.guests.map((guest) => guest.phone).filter(Boolean).join(', ') || 'телефон не указан'}
          </div>
          {booking.guests.some((guest) => guest.additionalInfo) && (
            <div className="text-[11.5px] text-muted/70 mt-0.5 max-w-[280px]">
              {booking.guests.map((guest) => guest.additionalInfo).filter(Boolean).join(' · ')}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Комната',
      key: 'room',
      responsive: ['md'],
      render: (_, booking) => {
        const room = roomById.get(booking.roomId);
        if (!room && booking.roomId === 0) {
          return <span className="text-muted text-[12px]">из заявки</span>;
        }
        return (
          <div className="text-[13px]">
            <div className="text-ink">№ {room?.number || '—'}</div>
            <div className="text-muted text-[12px]">{room?.roomTypeName || room?.name || room?.buildingName || ''}</div>
          </div>
        );
      },
    },
    {
      title: 'Даты',
      key: 'dates',
      responsive: ['md'],
      render: (_, booking) => {
        const startedBefore = booking.checkIn < windowEdges.from;
        const inHouseNow = isGuestInHouse(booking);
        return (
          <div className="text-[13px] whitespace-nowrap">
            <div className="text-ink">
              {formatDate(booking.checkIn)} — {formatDate(booking.checkOut)}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-muted text-[12px]">{nightsBetween(booking.checkIn, booking.checkOut)} ноч.</span>
              {inHouseNow && (
                <Tag color="blue" className="!m-0 !px-1.5 !text-[10px] leading-[16px]" icon={<HomeOutlined />}>
                  в доме
                </Tag>
              )}
              {!inHouseNow && startedBefore && (
                <Tag className="!m-0 !px-1.5 !text-[10px] leading-[16px]">заезд раньше периода</Tag>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: 'Сумма',
      key: 'amount',
      align: 'right',
      responsive: ['lg'],
      render: (_, booking) =>
        booking.totalAmount ? (
          <span className="font-display italic text-[15px] text-neon whitespace-nowrap">
            {formatPrice(booking.totalAmount)} р.
          </span>
        ) : (
          <span className="text-muted/40">—</span>
        ),
    },
    {
      title: 'Статус',
      key: 'status',
      render: (_, booking) => (
        <Tag color={statusColor(booking.status)} className="!m-0">
          {bookingStatusLabel(booking.status)}
        </Tag>
      ),
    },
    {
      title: '',
      key: 'actions',
      align: 'right',
      render: (_, booking) => (
        <div className="flex items-center justify-end gap-1.5">
          <Popconfirm
            title="Удалить бронь?"
            okText="Удалить"
            cancelText="Оставить"
            onConfirm={() => {
              setBookings((prev) => prev.filter((b) => b.id !== booking.id));
              console.log('[booking] удаляю', booking.id);
              deleteBooking(booking.id).catch((err) => {
                console.error('[booking] удаление не удалось', err);
                load();
              });
            }}
          >
            <Button size="small" type="text" danger icon={<DeleteOutlined />} aria-label="Удалить бронь" />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-7">
        <div>
          <span className="hud-label">Платформа Yurta</span>
          <h1 className="font-display text-3xl sm:text-4xl font-medium text-ink mt-3 mb-1.5 leading-tight">
            Брони <span className="italic text-neon">санатория</span>
          </h1>
          <p className="text-muted text-[13px] max-w-2xl">
            Все заезды, которые занимают номера в выбранном периоде: и те, что
            начинаются в нём, и те, где гость уже живёт. Отменённые не показываются.
            Оплату, заселение и договор меняйте в партнёрском кабинете — здесь
            список только для чтения.
          </p>
        </div>
        <Space wrap>
          <RangePicker
            value={period}
            presets={PERIOD_PRESETS}
            onChange={(values) => {
              if (values?.[0] && values[1]) {
                setRefreshing(true);
                setPeriod([values[0].startOf('day'), values[1].startOf('day')]);
              }
            }}
            allowClear={false}
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              setRefreshing(true);
              load();
            }}
            loading={loading || refreshing}
            className="!rounded-full"
          >
            Обновить
          </Button>
        </Space>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <div className="glass rounded-2xl p-4">
          <Statistic
            title="Броней в периоде"
            value={allBookings.length}
            styles={{ content: { color: 'var(--ink)', fontSize: 26 } }}
          />
        </div>
        <div className="glass rounded-2xl p-4">
          <Statistic
            title="Ждут оплаты"
            value={unpaid}
            styles={{ content: { color: 'var(--warm)', fontSize: 26 } }}
            prefix={unpaid > 0 ? <ExclamationCircleOutlined style={{ fontSize: 16 }} /> : undefined}
          />
        </div>
        <div className="glass rounded-2xl p-4">
          <Statistic
            title="Сейчас живут"
            value={inHouse.length}
            styles={{ content: { color: 'var(--accent-2)', fontSize: 26 } }}
            prefix={inHouse.length > 0 ? <HomeOutlined style={{ fontSize: 16 }} /> : undefined}
          />
        </div>
        <div className="glass rounded-2xl p-4">
          <Statistic
            title="Сегодня занято"
            value={occupancyToday ? `${occupancyToday.occupied} / ${occupancyToday.total}` : '—'}
            styles={{ content: { color: 'var(--accent)', fontSize: 26 } }}
          />
        </div>
        <div className="glass rounded-2xl p-4">
          <Statistic
            title="Комнат в пуле"
            value={rooms.length}
            styles={{ content: { color: 'var(--ink)', fontSize: 26 } }}
          />
        </div>
      </div>

      {error && (
        <Alert
          type="warning"
          showIcon
          message="Не удалось загрузить брони"
          description={`${error}. Проверьте, что под этим логином есть доступ к отелю в Yurta.`}
          className="!mb-5 !rounded-xl"
          action={
            <Button
              size="small"
              onClick={() => {
                setRefreshing(true);
                load();
              }}
            >
              Повторить
            </Button>
          }
        />
      )}

      {/* Диагностика: почему список пуст. Пустая решётка неотличима от «нет
          доступа к отелю», поэтому показываем, что реально пришёл из API. */}
      {loaded && !error && rawMeta && rawMeta.bookings === 0 && (
        <Alert
          type="info"
          showIcon
          message={rawMeta.rooms === 0 ? 'API вернул пустой список комнат' : 'Комнаты есть, броней в периоде нет'}
          description={
            rawMeta.rooms === 0
              ? 'Yurta отвечает на запрос, но не отдаёт ни одной комнаты. Обычно это значит, что у аккаунта менеджера нет доступа к отелю, либо токен устарел — войдите заново.'
              : `Комнат в пуле: ${rawMeta.rooms}. За выбранное время броней нет — расширьте период или нажмите «Обновить». Если бронь только что создана в партнёрском кабинете, она появится здесь после обновления.`
          }
          className="!mb-5 !rounded-xl"
        />
      )}

      {/* Брони есть в API, но не попадают в выбранный период — покажем кнопку
          для расширения периода до всех полученных броней (любой статус, любые даты). */}
      {loaded && !error && rawMeta && rawMeta.bookings > 0 && allBookings.length === 0 && (
        <Alert
          type="info"
          showIcon
          icon={<ExclamationCircleOutlined />}
          message={`API вернул ${rawMeta.bookings} броней, но ни одна не попадает в выбранный период`}
          description="Брони с любым статусом скрыты, так как их даты заезда/выезда не пересекают выбранное окно. Нажмите кнопку, чтобы расширить период и увидеть все заезды."
          className="!mb-5 !rounded-xl"
          action={
            <Button
              size="small"
              type="primary"
              onClick={() => {
                // Расширяем период до мин. checkIn и макс. checkOut из всех полученных броней
                const sample = bookings.length > 0 ? bookings : siteLeads.map(leadAsGridBooking);
                if (sample.length === 0) return;
                const minCheckIn = Math.min(...sample.map((b) => b.checkIn));
                const maxCheckOut = Math.max(...sample.map((b) => b.checkOut));
                setPeriod([dayjs.unix(minCheckIn).subtract(7, 'day').startOf('day'), dayjs.unix(maxCheckOut).add(7, 'day').startOf('day')]);
              }}
            >
              Показать все заезды
            </Button>
          }
        />
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <Input
          allowClear
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          prefix={<SearchOutlined className="text-accent/60" />}
          placeholder="Гость, телефон, номер комнаты или № брони"
          className="!rounded-full sm:max-w-sm"
        />
        <Select
          value={status}
          onChange={setStatus}
          className="sm:w-48"
          options={[
            { value: 'all', label: 'Любой статус' },
            { value: IN_HOUSE_FILTER, label: `Живут сейчас (${inHouse.length})` },
            ...statuses.map((value) => ({ value, label: bookingStatusLabel(value) })),
          ]}
        />
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <Table<GridBooking>
          rowKey="id"
          columns={columns}
          dataSource={visible}
          loading={loading}
          pagination={{ pageSize: 15, hideOnSinglePage: true }}
          scroll={{ x: 760 }}
          locale={{
            emptyText: error ? ' ' : 'В выбранном периоде номера свободны',
          }}
        />
      </div>

      <div className="mt-4 text-[11px] text-muted/60">
        Период: {formatDate(period[0])} — {formatDate(period[1])}. В список попадают и
        заезды, начавшиеся раньше ({GRID_LOOKBACK_DAYS} дн. назад запрошены): они помечены
        «в доме» или «заезд раньше периода».
      </div>
    </div>
  );
}
