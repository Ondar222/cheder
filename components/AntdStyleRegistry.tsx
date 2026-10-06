'use client';

import { useState } from 'react';
import { createCache, extractStyle, StyleProvider } from '@ant-design/cssinjs';
import { ConfigProvider, theme } from 'antd';
import ruRU from 'antd/locale/ru_RU';
import { useServerInsertedHTML } from 'next/navigation';

/**
 * antd v6 генерирует стили в рантайме (cssinjs). Без вставки этих стилей в
 * серверный HTML компоненты antd (Form, Modal, message) первое время рендерятся
 * без оформления — из-за этого блоки на главной «ездили рядами».
 * Реестр собирает стили в кэш и вставляет их в <head> на сервере.
 *
 * ConfigProvider переключает antd в тёмную тему «санатория будущего»,
 * чтобы Form/Modal/message наследовали неоновую палитру сайта.
 */
export default function AntdStyleRegistry({ children }: { children: React.ReactNode }) {
  const [cache] = useState(() => createCache());

  useServerInsertedHTML(() => (
    <style id="antd" data-antd-css="true" dangerouslySetInnerHTML={{ __html: extractStyle(cache, true) }} />
  ));

  return (
    <StyleProvider cache={cache}>
      <ConfigProvider
        locale={ruRU}
        theme={{
          algorithm: theme.darkAlgorithm,
          token: {
            colorPrimary: '#ddd0b0',
            colorBgBase: '#17140f',
            colorBgContainer: '#1e1a14',
            colorBgElevated: '#241f17',
            colorTextBase: '#f7f4ec',
            colorBorder: 'rgba(224, 212, 182, 0.25)',
            colorBorderSecondary: 'rgba(224, 212, 182, 0.14)',
            borderRadius: 12,
            fontFamily: 'var(--font-body), system-ui, sans-serif',
          },
        }}
      >
        {children}
      </ConfigProvider>
    </StyleProvider>
  );
}
