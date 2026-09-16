'use client';

import { useState } from 'react';
import { createCache, extractStyle, StyleProvider } from '@ant-design/cssinjs';
import { useServerInsertedHTML } from 'next/navigation';

/**
 * antd v6 генерирует стили в рантайме (cssinjs). Без вставки этих стилей в
 * серверный HTML компоненты antd (Card, Collapse, сетка) первое время рендерятся
 * без оформления — из-за этого блоки на главной «ездили рядами».
 * Реестр собирает стили в кэш и вставляет их в <head> на сервере.
 */
export default function AntdStyleRegistry({ children }: { children: React.ReactNode }) {
  const [cache] = useState(() => createCache());

  useServerInsertedHTML(() => (
    <style id="antd" data-antd-css="true" dangerouslySetInnerHTML={{ __html: extractStyle(cache, true) }} />
  ));

  return <StyleProvider cache={cache}>{children}</StyleProvider>;
}
