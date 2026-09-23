'use client';

import { useState } from 'react';
import { createCache, extractStyle, StyleProvider } from '@ant-design/cssinjs';
import { ConfigProvider, theme } from 'antd';
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
        theme={{
          algorithm: theme.darkAlgorithm,
          token: {
            colorPrimary: '#2ee6b8',
            colorBgBase: '#050807',
            colorBgContainer: '#0a100e',
            colorBgElevated: '#0d1512',
            colorTextBase: '#eaf6f1',
            colorBorder: 'rgba(46, 230, 184, 0.25)',
            colorBorderSecondary: 'rgba(46, 230, 184, 0.14)',
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
