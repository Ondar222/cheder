'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Alert, Button, Input, Popconfirm, Segmented, Select, Table, Tag, Typography } from 'antd';
import type { TableColumnsType } from 'antd';
import {
  DeleteOutlined,
  PhoneOutlined,
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { formatPrice } from '@/lib/booking';
import { formatDate } from '@/lib/datetime';
import {
  LEAD_STATUS_LABEL,
  deleteLead,
  fetchLeads,
  patchLead,
  type LeadStatus,
  type SiteLead,
} from '@/lib/leads';

const STATUS_TAG: Record<LeadStatus, string> = {
  new: 'gold',
  in_work: 'blue',
  booked: 'green',
  declined: 'default',
};

const STATUS_OPTIONS = (Object.keys(LEAD_STATUS_LABEL) as LeadStatus[]).map((value) => ({
  value,
  label: LEAD_STATUS_LABEL[value],
}));

const SOURCE_LABEL: Record<string, string> = {
  hero: 'Первый экран',
  header: 'Шапка',
  prices: 'Цены',
  contacts: 'Контакты',
  site: 'Сайт',
  admin: 'Кабинет',
};

/** «Иванов Иван Иванович» — как в заявке */
function fullName(lead: SiteLead, index = 0): string {
  const guest = lead.guests?.[index];
  if (!guest) return '—';
  return [guest.surname, guest.name, guest.patronymic].filter(Boolean).join(' ') || '—';
}

/**
 * Заявки из формы бронирования.
 *
 * Заявку принимает сервер сайта (POST /api/leads), он же создаёт по ней бронь
 * Yurta — поэтому список читается с сервера, а не из localStorage: менеджер
 * видит заявки со всех устройств и сразу понимает, встала бронь или нет.
 * Кнопка «Обновить» перечитывает склад: бронь, поставленную в партнёрском
 * кабинете или на другом сайте, видно в разделе «Брони» (это одна и та же
 * решётка отеля), а здесь обновляется статус самой заявки.
 */
export default function LeadsBoard() {
  const [leads, setLeads] = useState<SiteLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState<string | null>(null);
  const [status, setStatus] = useState<LeadStatus | 'all'>('all');
  const [query, setQuery] = useState('');
  const [reloadToken, setReloadToken] = useState(0);

  // Заявки тянем с сервера: он же создал по ним брони, поэтому список всегда
  // свежий. Состояние меняем только в колбэках промиса — синхронный setState
  // в эффекте дал бы каскадный рендер.
  useEffect(() => {
    let active = true;
    fetchLeads()
      .then(({ leads: list, onServer, message }) => {
        if (!active) return;
        setLeads(list);
        setOffline(onServer ? null : message ?? 'Показан локальный резерв браузера');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [reloadToken]);

  const reload = useCallback(() => {
    setLoading(true);
    setReloadToken((value) => value + 1);
  }, []);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return leads.filter((lead) => {
      if (status !== 'all' && lead.status !== status) return false;
      if (!needle) return true;
      const haystack = [
        fullName(lead),
        ...(lead.guests ?? []).flatMap((guest) => [guest.surname, guest.name, guest.phone, guest.passport]),
        lead.phone,
        lead.comment,
        lead.bookingId ? String(lead.bookingId) : '',
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [leads, status, query]);

  const counts = useMemo(
    () => ({
      all: leads.length,
      new: leads.filter((lead) => lead.status === 'new').length,
      booked: leads.filter((lead) => Boolean(lead.bookingId)).length,
    }),
    [leads],
  );

  const handleStatus = (lead: SiteLead, next: LeadStatus) => {
    setLeads((prev) => prev.map((item) => (item.leadId === lead.leadId ? { ...item, status: next } : item)));
    void patchLead(lead.leadId, { status: next }).then((ok) => {
      if (!ok) reload();
    });
  };

  const handleDelete = (lead: SiteLead) => {
    setLeads((prev) => prev.filter((item) => item.leadId !== lead.leadId));
    void deleteLead(lead.leadId);
  };

  const columns: TableColumnsType<SiteLead> = [
    {
      title: 'Гость',
      key: 'guest',
      render: (_, lead) => (
        <div>
          <div className="text-ink font-medium text-[13.5px]">{fullName(lead)}</div>
          {lead.phone && (
            <a
              href={`tel:${lead.phoneE164 ?? lead.phone}`}
              className="inline-flex items-center gap-1.5 text-[12px] text-accent hover:text-accent-2 transition-colors"
            >
              <PhoneOutlined className="text-[11px]" /> {lead.phone}
            </a>
          )}
          {lead.guests?.length > 1 && (
            <div className="text-muted text-[11.5px] mt-0.5">
              ещё {lead.guests.length - 1} гост.:{' '}
              {lead.guests.slice(1).map((guest) => [guest.surname, guest.name].filter(Boolean).join(' ')).join(', ')}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Паспорт',
      key: 'passport',
      responsive: ['lg'],
      render: (_, lead) => {
        const guest = lead.guests?.[0];
        return guest?.passport ? (
          <span className="text-[12.5px] text-muted">{guest.passport}</span>
        ) : (
          <span className="text-muted/40 text-[12.5px]">—</span>
        );
      },
    },
    {
      title: 'Заезд',
      key: 'stay',
      responsive: ['md'],
      render: (_, lead) => (
        <div className="text-[13px] whitespace-nowrap">
          <div className="text-ink">
            {formatDate(lead.checkIn)} — {formatDate(lead.checkOut)}
          </div>
          <div className="text-muted text-[12px]">
            {lead.nights} ноч. · {lead.guests?.length ?? 1} гост. · {lead.roomTypeLabel}
          </div>
        </div>
      ),
    },
    {
      title: 'Сумма',
      key: 'total',
      align: 'right',
      responsive: ['md'],
      render: (_, lead) => (
        <span className="font-display italic text-[15px] text-neon whitespace-nowrap">
          {formatPrice(lead.total)} р.
        </span>
      ),
    },
    {
      title: 'Комментарий',
      key: 'comment',
      responsive: ['lg'],
      render: (_, lead) =>
        lead.comment ? (
          <Typography.Paragraph ellipsis={{ rows: 2 }} className="!mb-0 !text-[12.5px] !text-muted max-w-[240px]">
            {lead.comment}
          </Typography.Paragraph>
        ) : (
          <span className="text-muted/40 text-[12.5px]">—</span>
        ),
    },
    {
      title: 'Откуда',
      key: 'source',
      responsive: ['lg'],
      render: (_, lead) => <span className="text-muted text-[12.5px]">{SOURCE_LABEL[lead.source] ?? lead.source}</span>,
    },
    {
      title: 'Бронь',
      key: 'booking',
      render: (_, lead) => {
        if (lead.bookingId) {
          return <span className="font-mono-hud text-[11px] text-accent">#{lead.bookingId}</span>;
        }
        if (lead.bookingError) {
          return (
            <Typography.Text type="warning" className="!text-[11.5px] max-w-[180px] inline-block">
              {lead.bookingError}
            </Typography.Text>
          );
        }
        return <span className="text-muted/40 text-[12px]">не создана</span>;
      },
    },
    {
      title: 'Статус',
      key: 'status',
      render: (_, lead) => (
        <Tag color={STATUS_TAG[lead.status]} className="!m-0">
          {LEAD_STATUS_LABEL[lead.status]}
        </Tag>
      ),
    },
    {
      title: '',
      key: 'actions',
      align: 'right',
      render: (_, lead) => (
        <div className="flex items-center justify-end gap-1.5">
          <Select
            size="small"
            value={lead.status}
            options={STATUS_OPTIONS}
            onChange={(next) => handleStatus(lead, next as LeadStatus)}
            className="min-w-[110px]"
          />
          {!lead.bookingId && (
            <Link href={`/admin/new?lead=${lead.leadId}`}>
              <Button size="small" type="primary" icon={<PlusOutlined />}>
                В бронь
              </Button>
            </Link>
          )}
          <Popconfirm
            title="Удалить заявку?"
            okText="Удалить"
            cancelText="Оставить"
            onConfirm={() => handleDelete(lead)}
          >
            <Button size="small" type="text" danger icon={<DeleteOutlined />} aria-label="Удалить заявку" />
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-7">
        <div>
          <span className="hud-label">Отдел продаж</span>
          <h1 className="font-display text-3xl sm:text-4xl font-medium text-ink mt-3 mb-1.5 leading-tight">
            Заявки <span className="italic text-neon">с сайта</span>
          </h1>
          <p className="text-muted text-[13px] max-w-2xl">
            Всего {counts.all}, новых {counts.new}, в брони {counts.booked}. Бронь в Yurta
            создаётся автоматически при приёме заявки — номер и заезд видны в разделе «Брони».
          </p>
        </div>
        <Button icon={<ReloadOutlined />} onClick={reload} loading={loading} className="!rounded-full">
          Обновить
        </Button>
      </div>

      {offline && (
        <Alert
          type="warning"
          showIcon
          message="Список показан из локального резерва"
          description={`${offline}. Сервер заявок недоступен — данные могут быть неполными.`}
          className="!mb-5 !rounded-xl"
        />
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <Segmented
          value={status}
          onChange={(value) => setStatus(value as LeadStatus | 'all')}
          options={[
            { value: 'all', label: `Все (${counts.all})` },
            { value: 'new', label: `Новые (${counts.new})` },
            ...(['in_work', 'booked', 'declined'] as LeadStatus[]).map((value) => ({
              value,
              label: LEAD_STATUS_LABEL[value],
            })),
          ]}
        />
        <Input
          allowClear
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          prefix={<SearchOutlined className="text-accent/60" />}
          placeholder="Имя, телефон, паспорт или № брони"
          className="!rounded-full sm:max-w-xs"
        />
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <Table<SiteLead>
          rowKey="leadId"
          columns={columns}
          dataSource={visible}
          loading={loading}
          pagination={{ pageSize: 12, hideOnSinglePage: true }}
          scroll={{ x: 900 }}
          locale={{
            emptyText: (
              <div className="py-12 text-center">
                <p className="text-ink text-[15px] mb-1.5">Заявок пока нет</p>
                <p className="text-muted text-[13px] max-w-md mx-auto">
                  Они появляются здесь после отправки формы «Забронировать» на сайте. Бронь в
                  Yurta создаётся сразу, и заезд виден в разделе «Брони».
                </p>
              </div>
            ),
          }}
        />
      </div>
    </div>
  );
}