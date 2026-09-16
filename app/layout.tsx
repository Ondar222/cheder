import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Курорт «Чедер» — Санаторно-курортный комплекс | Республика Тыва",
  description: "Курортно-оздоровительный комплекс на берегу соленого озера Чедер в Кызылском кожууне Республики Тыва. Лечебные грязи, минеральные воды, грязелечение, трёхразовое питание. Стоимость от 3 500₽/сутки.",
  keywords: ["курорт чедер", "санаторий тыва", "лечебные грязи", "оздоровление", "республика тыва", "кызыл", "здравница чедер"],
  icons: {
    icon: '/favicon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <link rel="icon" href="/favicon.png" sizes="any" />
      </head>
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}