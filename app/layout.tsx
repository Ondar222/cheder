import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope, JetBrains_Mono } from "next/font/google";
import AntdStyleRegistry from "@/components/AntdStyleRegistry";
import "./globals.css";

// Элегантная типографика «отеля будущего» (все — с кириллицей):
// Cormorant Garamond — нежный serif для заголовков, Manrope — текст,
// JetBrains Mono — едва заметные премиальные мелочи
const display = Cormorant_Garamond({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-display",
});
const body = Manrope({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});
const mono = JetBrains_Mono({
  subsets: ["latin", "cyrillic"],
  weight: ["400"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Курорт «Чедер» — здравница будущего | Республика Тыва",
  description:
    "Курортно-оздоровительный комплекс на берегу соленого озера Чедер в Кызылском кожууне Республики Тыва. Лечебные грязи, минеральные воды, грязелечение, трёхразовое питание. Стоимость от 3 500₽/сутки.",
  keywords: [
    "курорт чедер",
    "санаторий тыва",
    "лечебные грязи",
    "оздоровление",
    "республика тыва",
    "кызыл",
    "здравница чедер",
  ],
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <head>
        <link rel="icon" href="/favicon.png" sizes="any" />
      </head>
      <body className="min-h-screen flex flex-col antialiased">
        <AntdStyleRegistry>{children}</AntdStyleRegistry>
      </body>
    </html>
  );
}