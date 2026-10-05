'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Button, Input, Popconfirm, Segmented, Select, Table, Tag, Typography } from 'antd';
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
  readLeads,
  removeLead,
  updateLead,
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
};

/**
 * Заявки из формы бронирования.
 *
 * Приёмника у сайта нет, поэтому список читает localStorage (см. lib/leads.ts):
 * здесь видно, кто просил путёвку, и отсюда заявка отправляется в бронь Yurta.
 */
export default function LeadsBoard() {
  // readLeads() безопасен на сервере (вернёт []), а таблица монтируется уже
  // после gates-ready, поэтому на hydration попадает только клиентское значение.
  const [leads, setLeads] = useState<SiteLead[]>(() => readLeads());
  const [status, setStatus] = useState<LeadStatus | 'all'>('all');
  const [query, setQuery] = useState('');

  const reload = useCallback(() => setLeads(readLeads()), []);

  // Заявки гость отправляет в своём окне: синхронизируемся по событию storage,
  // setState происходит в обработчике, а не в теле эффекта.
  useEffect(() => {
    window.addEventListener('storage', reload);
    return () => window.removeEventListener('storage', reload);
  }, [reload]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return leads.filter((lead) => {
      if (status !== 'all' && lead.status !== status) return false;
      if (!needle) return true;
      return [lead.name, lead.surname, lead.phone, lead.comment]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(needle));
    });
  }, [leads, status, query]);

  const counts = useMemo(
    () => ({
      all: leads.length,
      new: leads.filter((lead) => lead.status === 'new').length,
    }),
    [leads],
  );

  const handleStatus = (lead: SiteLead, next: LeadStatus) => {
    updateLead(lead.leadId, { status: next });
    reload();
  };

  const handleDelete = (lead: SiteLead) => {
    removeLead(lead.leadId);
    reload();
  };

  const columns: TableColumnsType<SiteLead> = [
    {
      title: 'Гость',
      key: 'guest',
      render: (_, lead) => (
        <div>
          <div className="text-ink font-medium text-[13.5px]">
            {lead.surname} {lead.name}
          </div>
          <a
            href={`tel:${lead.phone}`}
            className="inline-flex items-center gap-1.5 text-[12px] text-accent hover:text-accent-2 transition-colors"
          >
            <PhoneOutlined className="text-[11px]" /> {lead.phone}
          </a>
        </div>
      ),
    },
    {
      title: 'Заезд',
      key: 'stay',
      responsive: ['md'],
      render: (_, lead) => (
        <div className="text-[13px]">
          <div className="text-ink">{formatDate(lead.checkIn)}</div>
          <div className="text-muted text-[12px]">{lead.nights} ноч. · {lead.roomTypeLabel}</div>
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
          <Typography.Paragraph ellipsis={{ rows: 2 }} className="!mb-0 !text-[12.5px] !text-muted max-w-[260px]">
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
      title: 'Заявка',
      key: 'created',
      responsive: ['lg'],
      render: (_, lead) => <span className="text-muted text-[12.5px]">{formatDate(lead.submittedAt)}</span>,
    },
    {
      title: 'Статус',
      key: 'status',
      render: (_, lead) => (
        <div className="flex items-center gap-2">
          <Tag color={STATUS_TAG[lead.status]} className="!m-0">
            {LEAD_STATUS_LABEL[lead.status]}
          </Tag>
          {lead.bookingId && (
            <span className="font-mono-hud text-[10px] text-accent">#{lead.bookingId}</span>
          )}
        </div>
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
          {lead.status !== 'booked' && (
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
            Всего {counts.all}, новых {counts.new}. Обработайте заявку по телефону и
            создайте бронь в Yurta — она появится в разделе «Брони».
          </p>
        </div>
        <Button icon={<ReloadOutlined />} onClick={reload} className="!rounded-full">
          Обновить
        </Button>
      </div>

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
          placeholder="Имя, телефон или комментарий"
          className="!rounded-full sm:max-w-xs"
        />
      </div>

      <div className="glass rounded-2xl overflow-hidden">
        <Table<SiteLead>
          rowKey="leadId"
          columns={columns}
          dataSource={visible}
          pagination={{ pageSize: 12, hideOnSinglePage: true }}
          scroll={{ x: 720 }}
          locale={{
            emptyText: (
              <div className="py-12 text-center">
                <p className="text-ink text-[15px] mb-1.5">Заявок пока нет</p>
                <p className="text-muted text-[13px] max-w-md mx-auto">
                  Они появляются здесь после отправки формы «Забронировать» на сайте.
                  Заявки хранятся в этом браузере, поэтому проверяйте тот компьютер,
                  где открыта админка, и подключите NEXT_PUBLIC_BOOKING_WEBHOOK, чтобы
                  они шли в CRM.
                </p>
              </div>
            ),
          }}
        />
      </div>
    </div>
  );
}
