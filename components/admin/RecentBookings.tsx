'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Alert, Button, Spin, Table, Tag } from 'antd';
import type { TableColumnsType } from 'antd';
import { ArrowRightOutlined, HomeOutlined, ReloadOutlined, ThunderboltOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { describeApiError } from '@/lib/api';
import {
  GRID_LOOKBACK_DAYS,
  bookingStatusLabel,
  fetchBookingGrid,
  isGuestInHouse,
  type GridBooking,
} from '@/lib/bookingApi';
import { formatDate, nightsBetween, toUnix } from '@/lib/datetime';
import { formatPrice } from '@/lib/booking';
import { fetchLeads, type SiteLead } from '@/lib/leads';

/**
 * Ближайшие брони из Yurta на главной кабинета.
 *
 * Заявки с сайта и брони отеля — разные сущности: заявка ещё не означает
 * размещённый номер. Менеджер открывает /admin первым делом, поэтому рядом со
 * заявками показываем и заезды из решётки: что уже идёт и что впереди.
 *
 * Список читается напрямую из /v4/booking/grid под токеном менеджера — те же
 * данные, что видит доска /admin/bookings, только в компактном виде.
 */

/** Сколько заездов показываем: экран кабинета остаётся читаемым */
const PREVIEW_LIMIT = 8;

/** Период превью: запас назад ловит уже идущие заезды, вперёд — ближайшие */
const PREVIEW_AHEAD_DAYS = 60;

/** Цвет статуса — как в доске броней */
function statusColor(status: string): string {
  if (/PAID/i.test(status) && !/UNPAID/i.test(status)) return 'green';
  if (/CHECKED_IN|IN_HOUSE/i.test(status)) return 'blue';
  if (/CANCEL/i.test(status)) return 'red';
  return 'gold';
}

/** Синтетический id заявки для таблицы: отрицательный, чтобы не путать с id брони */
function leadSyntheticId(lead: SiteLead): number {
  let hash = 0;
  for (const ch of lead.leadId) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
  return -(Math.abs(hash) || 1);
}

/** Заявка → GridBooking, чтобы лежать в одной таблице с бронями Yurta */
function leadAsGridBooking(lead: SiteLead): GridBooking {
  return {
    id: lead.bookingId ?? leadSyntheticId(lead),
    roomId: 0,
    checkIn: toUnix(lead.checkIn),
    checkOut: toUnix(lead.checkOut),
    status: lead.status === 'booked' ? 'NEW' : 'DRAFT',
    totalAmount: lead.total,
    comment: lead.comment ?? '',
    guests: lead.guests?.length
      ? lead.guests.map((g) => ({
          name: g.name ?? '',
          surname: g.surname ?? '',
          patronymic: g.patronymic ?? '',
          phone: g.phone ?? '',
        }))
      : [{ name: '', surname: '', patronymic: '', phone: lead.phone ?? '' }],
  };
}

export default function RecentBookings() {
  const [bookings, setBookings] = useState<GridBooking[]>([]);
  const [siteLeads, setSiteLeads] = useState<SiteLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let active = true;

    Promise.allSettled([
      fetchBookingGrid({
        checkIn: toUnix(dayjs().subtract(GRID_LOOKBACK_DAYS, 'day')),
        checkOut: toUnix(dayjs().add(PREVIEW_AHEAD_DAYS, 'day')),
      }),
      fetchLeads().then(({ leads }) => leads),
    ]).then(([gridResult, leadsResult]) => {
      if (!active) return;
      if (gridResult.status === 'fulfilled') {
        setBookings(gridResult.value.bookings);
        setError(null);
      } else {
        setError(describeApiError(gridResult.reason));
      }
      if (leadsResult.status === 'fulfilled') {
        setSiteLeads(leadsResult.value);
      }
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [reloadToken]);

  /** id броней из Yurta — чтобы не дублировать заявку, уже ставшую бронью */
  const gridIds = useMemo(() => new Set(bookings.map((b) => b.id)), [bookings]);

  /** id синтетических заявок — для пометки «сайт» */
  const siteIds = useMemo(
    () => new Set(siteLeads.filter((l) => !l.bookingId).map(leadSyntheticId)),
    [siteLeads],
  );

  /**
   * Порядок показа: сначала живущие сейчас и ближайшие заезды. Заявки с сайта
   * добавляем в общий список — бронь из заявки может быть не видна в решётке
   * менеджера, но менеджер обязан её видеть.
   */
  const upcoming = useMemo(() => {
    const today = toUnix(dayjs().startOf('day'));
    const fromLeads = siteLeads
      .filter((lead) => !lead.bookingId || !gridIds.has(lead.bookingId))
      .map(leadAsGridBooking);

    return [...bookings, ...fromLeads]
      .sort((a, b) => {
        const aLive = isGuestInHouse(a) ? 0 : 1;
        const bLive = isGuestInHouse(b) ? 0 : 1;
        if (aLive !== bLive) return aLive - bLive;
        return a.checkIn - b.checkIn;
      })
      .filter((booking) => booking.checkOut > today)
      .slice(0, PREVIEW_LIMIT);
  }, [bookings, siteLeads, gridIds]);

  const columns: TableColumnsType<GridBooking> = [
    {
      title: 'Гость',
      key: 'guest',
      render: (_, booking) => (
        <div>
          <div className="text-ink text-[13px]">
            {booking.guests.map((g) => [g.surname, g.name].filter(Boolean).join(' ')).join(', ') || '—'}
          </div>
          <div className="text-muted text-[11.5px] font-mono-hud">
            #{booking.id > 0 ? booking.id : Math.abs(booking.id)}
            {siteIds.has(booking.id) && (
              <Tag icon={<ThunderboltOutlined />} color="cyan" className="ml-1 px-1 text-[10px] leading-4">
                сайт
              </Tag>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Даты',
      key: 'dates',
      render: (_, booking) => (
        <div className="text-[12.5px] whitespace-nowrap">
          <div className="text-ink">
            {formatDate(booking.checkIn)} — {formatDate(booking.checkOut)}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-muted text-[11.5px]">{nightsBetween(booking.checkIn, booking.checkOut)} ноч.</span>
            {isGuestInHouse(booking) && (
              <Tag color="blue" className="m-0 px-1.5 text-[10px] leading-4" icon={<HomeOutlined />}>
                в доме
              </Tag>
            )}
          </div>
        </div>
      ),
    },
    {
      title: 'Сумма',
      key: 'amount',
      align: 'right',
      responsive: ['md'],
      render: (_, booking) =>
        booking.totalAmount ? (
          <span className="text-[13px] text-neon whitespace-nowrap">{formatPrice(booking.totalAmount)} р.</span>
        ) : (
          <span className="text-muted/40">—</span>
        ),
    },
    {
      title: 'Статус',
      key: 'status',
      render: (_, booking) => (
        <Tag color={statusColor(booking.status)} className="m-0">
          {bookingStatusLabel(booking.status)}
        </Tag>
      ),
    },
  ];

  return (
    <div className="mb-8">
      <div className="flex items-end justify-between gap-4 mb-4">
        <div>
          <span className="hud-label">Платформа Yurta</span>
          <h2 className="font-display text-2xl font-medium text-ink mt-2 leading-tight">
            Ближайшие <span className="italic text-neon">брони</span>
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="small"
            icon={<ReloadOutlined />}
            loading={loading}
            onClick={() => setReloadToken((value) => value + 1)}
            className="!rounded-full"
          >
            Обновить
          </Button>
          <Link href="/admin/bookings">
            <Button size="small" type="link" icon={<ArrowRightOutlined />} className="!px-0">
              Все брони
            </Button>
          </Link>
        </div>
      </div>

      {error && (
        <Alert
          type="warning"
          showIcon
          message="Брони из Yurta не загрузились"
          description={`${error}. Проверьте вход в кабинет и доступ к отелю.`}
          className="!mb-4 !rounded-xl"
        />
      )}

      <div className="glass rounded-2xl overflow-hidden">
        {loading ? (
          <div className="py-16 flex justify-center">
            <Spin />
          </div>
        ) : (
          <Table<GridBooking>
            rowKey="id"
            size="small"
            columns={columns}
            dataSource={upcoming}
            pagination={false}
            scroll={{ x: 560 }}
            locale={{ emptyText: 'Ближайших броней нет' }}
          />
        )}
      </div>
    </div>
  );
}
