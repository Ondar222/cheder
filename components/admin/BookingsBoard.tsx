'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Button, DatePicker, Input, Select, Space, Statistic, Table, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import {
  ExclamationCircleOutlined,
  HomeOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import { describeApiError } from '@/lib/api';
import {
  GRID_LOOKBACK_DAYS,
  bookingStatusLabel,
  fetchBookingGrid,
  isCancelledStay,
  isGuestInHouse,
  stayOverlapsWindow,
  type GridBooking,
  type GridRoom,
} from '@/lib/bookingApi';
import { formatDate, nightsBetween, toUnix } from '@/lib/datetime';
import { formatPrice } from '@/lib/booking';

const { RangePicker } = DatePicker;

/** Значение фильтра «живут сейчас» в Select статусов: настоящего статуса с таким id нет */
const IN_HOUSE_FILTER = '__in_house';

/** Быстрые окна: менеджеру нужно и «что было», и «что впереди» */
const PERIOD_PRESETS: { label: string; value: [Dayjs, Dayjs] }[] = [
  { label: 'Сегодня', value: [dayjs().startOf('day'), dayjs().startOf('day')] },
  { label: 'Неделя', value: [dayjs().startOf('day'), dayjs().add(6, 'day').startOf('day')] },
  { label: 'Две недели', value: [dayjs().startOf('day'), dayjs().add(13, 'day').startOf('day')] },
  { label: 'Месяц', value: [dayjs().startOf('day'), dayjs().add(29, 'day').startOf('day')] },
  { label: 'Этот месяц', value: [dayjs().startOf('month'), dayjs().endOf('month').startOf('day')] },
  { label: 'Прошедший месяц', value: [dayjs().subtract(1, 'month').startOf('month'), dayjs().subtract(1, 'month').endOf('month').startOf('day')] },
];

/** Цвет статуса — та же логика, что подсветка в шахматке партнёрского кабинета */
function statusColor(status: string): string {
  if (/PAID/i.test(status) && !/UNPAID/i.test(status)) return 'green';
  if (/CHECKED_IN|IN_HOUSE/i.test(status)) return 'blue';
  if (/CANCEL/i.test(status)) return 'red';
  return 'gold';
}

/**
 * Брони санатория из Yurta за выбранный период.
 *
 * Источник — решётка /v4/booking/grid: она отдаёт и комнаты, и все брони, поэтому
 * одного запроса хватает и на таблицу, и на счётчики загрузки на сегодня.
 */
export default function BookingsBoard() {
  const [period, setPeriod] = useState<[Dayjs, Dayjs]>(() => [dayjs().startOf('day'), dayjs().add(14, 'day').startOf('day')]);
  const [rooms, setRooms] = useState<GridRoom[]>([]);
  const [bookings, setBookings] = useState<GridBooking[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<string>('all');

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
        setRooms(grid.rooms);
        setBookings(grid.bookings);
        setError(null);
      })
      .catch((err: unknown) => setError(describeApiError(err)))
      .finally(() => {
        setLoaded(true);
        setRefreshing(false);
      });
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);

  const loading = !loaded;

  const roomById = useMemo(() => new Map(rooms.map((room) => [room.id, room])), [rooms]);

  /**
   * Границы выбранного периода: заезд в первую ночь начала и выезд в последнюю
   * ночь перед концом. Сравниваем с ними, а не с датами «как попало».
   */
  const windowEdges = useMemo(
    () => ({ from: toUnix(period[0]), to: toUnix(period[1].add(1, 'day')) }),
    [period],
  );

  /**
   * Заезды, которые занимают комнаты в выбранном периоде: и те, что начинаются
   * в нём, и те, что начались раньше (гость уже живёт), и те, что закончатся
   * после его конца. Отменённые в список не входят — номер свободен.
   */
  const inPeriod = useMemo(
    () =>
      bookings
        .filter((booking) => !isCancelledStay(booking))
        .filter((booking) => stayOverlapsWindow(booking, windowEdges.from, windowEdges.to)),
    [bookings, windowEdges],
  );

  const statuses = useMemo(
    () => Array.from(new Set(inPeriod.map((booking) => booking.status))),
    [inPeriod],
  );

  /** Сейчас в номерах — по всему ответу решётки, независимо от выбранного окна */
  const inHouse = useMemo(() => bookings.filter((booking) => !isCancelledStay(booking) && isGuestInHouse(booking)), [bookings]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return inPeriod
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
          ...booking.guests.flatMap((guest) => [guest.name, guest.surname, guest.phone, guest.email]),
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
  }, [inPeriod, query, status, roomById]);

  /** Комнаты, у которых есть активная бронь на сегодня */
  const occupancyToday = useMemo(() => {
    if (rooms.length === 0) return null;
    const occupied = new Set(inHouse.map((booking) => booking.roomId));
    return { occupied: occupied.size, total: rooms.length };
  }, [inHouse, rooms]);

  const unpaid = inPeriod.filter((booking) => bookingStatusLabel(booking.status) === 'Не оплачен').length;

  const columns: TableColumnsType<GridBooking> = [
    {
      title: 'Бронь',
      key: 'id',
      width: 90,
      render: (_, booking) => (
        <span className="font-mono-hud text-[11px] text-muted">#{booking.id}</span>
      ),
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
        </div>
      ),
    },
    {
      title: 'Комната',
      key: 'room',
      responsive: ['md'],
      render: (_, booking) => {
        const room = roomById.get(booking.roomId);
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
          <Statistic title="Броней в периоде" value={inPeriod.length} valueStyle={{ color: 'var(--ink)', fontSize: 26 }} />
        </div>
        <div className="glass rounded-2xl p-4">
          <Statistic
            title="Ждут оплаты"
            value={unpaid}
            valueStyle={{ color: 'var(--warm)', fontSize: 26 }}
            prefix={unpaid > 0 ? <ExclamationCircleOutlined style={{ fontSize: 16 }} /> : undefined}
          />
        </div>
        <div className="glass rounded-2xl p-4">
          <Statistic
            title="Сейчас живут"
            value={inHouse.length}
            valueStyle={{ color: 'var(--accent-2)', fontSize: 26 }}
            prefix={inHouse.length > 0 ? <HomeOutlined style={{ fontSize: 16 }} /> : undefined}
          />
        </div>
        <div className="glass rounded-2xl p-4">
          <Statistic
            title="Сегодня занято"
            value={occupancyToday ? `${occupancyToday.occupied} / ${occupancyToday.total}` : '—'}
            valueStyle={{ color: 'var(--accent)', fontSize: 26 }}
          />
        </div>
        <div className="glass rounded-2xl p-4">
          <Statistic title="Комнат в пуле" value={rooms.length} valueStyle={{ color: 'var(--ink)', fontSize: 26 }} />
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
