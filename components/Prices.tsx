'use client';

import { Card, Tag } from 'antd';
import { StarFilled, TagOutlined, FileTextOutlined } from '@ant-design/icons';

const prices = [
  {
    period: 'Январь — Февраль 2026',
    price: '3 500₽',
    perDay: 'за сутки',
    included: [
      'Проживание',
      'Трёхразовое питание',
      'Грязелечение',
      'Минеральная ванна',
      'Аромафитотерапия',
      'ЛФК',
      'Приём терапевта',
    ],
    highlight: false,
    color: '#95d5b2',
  },
  {
    period: 'Март — Апрель 2026',
    price: '3 990₽',
    perDay: 'за сутки',
    included: [
      'Проживание',
      'Трёхразовое питание',
      'Грязелечение',
      'Минеральная ванна',
      'Аромафитотерапия',
      'ЛФК',
      'Приём терапевта',
    ],
    highlight: true,
    color: '#40916c',
  },
  {
    period: 'Август 2026',
    price: '5 000₽',
    perDay: 'за сутки',
    included: [
      'Проживание',
      'Трёхразовое питание',
      'Грязелечение',
      'Минеральная ванна',
      'Аромафитотерапия',
      'ЛФК',
      'Приём терапевта',
    ],
    highlight: false,
    color: '#2d6a4f',
  },
];

export default function Prices() {
  return (
    <section id="prices" className="py-14 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8 fade-section">
          <span className="inline-block text-primary font-semibold text-sm tracking-wider uppercase mb-3">Стоимость</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-primary-dark mb-3">
            Актуальные цены
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            В стоимость проживания включён полный комплекс оздоровительных процедур и трёхразовое питание.
          </p>
        </div>

        {/*
          Один ряд во всех версиях. На мобильных карточки в ряд и листаются
          свайпом (snap-карусель), от планшета — обычная сетка из трёх.
        */}
        <div className="sm:max-w-4xl lg:max-w-5xl mx-auto">
          <div className="-mx-4 sm:mx-0 pt-4 pb-3">
            <div className="flex sm:grid sm:grid-cols-3 gap-2 sm:gap-5 overflow-x-auto sm:overflow-visible no-scrollbar snap-x snap-proximity px-4 sm:px-0">
              {prices.map((p, i) => (
                <Card
                  key={i}
                  className={`fade-section h-full shrink-0 min-w-[62%] sm:shrink sm:min-w-0 snap-center border-0 shadow-lg transition-all duration-300 hover:shadow-2xl sm:hover:-translate-y-2 ${
                    p.highlight ? 'ring-1 sm:ring-2 ring-primary relative' : ''
                  }`}
                  styles={{ body: { padding: 0, height: '100%' } }}
                >
                  {p.highlight && (
                    <div className="absolute -top-2 sm:-top-3 left-1/2 -translate-x-1/2 z-10">
                      <Tag color="primary" className="!px-1.5 sm:!px-3.5 !py-0 sm:!py-0.5 !text-[8px] sm:!text-xs rounded-full font-semibold whitespace-nowrap">
                        Лучшая цена
                      </Tag>
                    </div>
                  )}
                  <div className="text-center px-3 pt-4 pb-3 sm:px-5 sm:pt-6 sm:pb-4 h-full flex flex-col">
                    <h3 className="text-xs sm:text-base font-bold text-gray-900 mb-0.5 sm:mb-1 leading-tight">{p.period}</h3>
                    {p.highlight && (
                      <div className="hidden sm:flex items-center justify-center gap-1 mb-2.5">
                        {[...Array(5)].map((_, j) => (
                          <StarFilled key={j} className="text-accent text-xs" />
                        ))}
                      </div>
                    )}
                    <div className="text-lg sm:text-3xl font-bold text-primary mb-0 leading-tight whitespace-nowrap">{p.price}</div>
                    <div className="text-gray-500 text-[10px] sm:text-xs mb-2 sm:mb-4">{p.perDay}</div>

                    {/* Компактный список на мобильных */}
                    <div className="border-t border-gray-100 pt-2.5 sm:hidden space-y-1.5 text-left mt-auto">
                      {p.included.slice(0, 4).map((item) => (
                        <div key={item} className="flex items-center gap-1.5 text-[11px] leading-tight text-gray-700">
                          <span
                            className="w-3 h-3 min-w-[12px] rounded-full flex items-center justify-center text-white text-[7px] flex-shrink-0"
                            style={{ backgroundColor: p.color }}
                          >
                            ✓
                          </span>
                          <span className="truncate">{item}</span>
                        </div>
                      ))}
                    </div>

                    {/* Полный список от планшета */}
                    <div className="hidden sm:block border-t border-gray-100 pt-4 space-y-2 text-left">
                      {p.included.map((item) => (
                        <div key={item} className="flex items-center gap-2 text-[13px] text-gray-700">
                          <span
                            className="w-[18px] h-[18px] min-w-[18px] rounded-full flex items-center justify-center text-white text-[10px] flex-shrink-0"
                            style={{ backgroundColor: p.color }}
                          >
                            ✓
                          </span>
                          {item}
                        </div>
                      ))}
                    </div>

                    <a href="tel:+79133405566" className="block mt-3 sm:mt-5">
                      <button
                        className={`w-full py-1.5 sm:py-2 rounded-full font-semibold text-xs sm:text-sm transition-all duration-300 sm:hover:-translate-y-0.5 shadow-md hover:shadow-lg ${
                          p.highlight
                            ? 'bg-primary hover:bg-primary-dark text-white'
                            : 'bg-primary/10 hover:bg-primary/20 text-primary'
                        }`}
                      >
                        Забронировать
                      </button>
                    </a>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Подсказка о свайпе — только на мобильных */}
          <div className="flex sm:hidden items-center justify-center gap-1.5 mt-1 text-[11px] text-gray-400">
            <span>←</span>
            <span>листайте, чтобы сравнить</span>
            <span>→</span>
          </div>
        </div>

        {/* Special offers */}
        <div className="mt-16 grid sm:grid-cols-2 gap-6 fade-section">
          <Card className="border-0 shadow-md bg-gradient-to-r from-primary-dark to-primary text-white hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            styles={{ body: { padding: '28px' } }}
          >
            <div className="flex items-center gap-3 mb-2">
              <TagOutlined className="text-xl" />
              <h3 className="text-xl font-bold">Скидка для гостей 60+</h3>
            </div>
            <p className="text-white/85 text-sm leading-relaxed">
              Стоимость проживания в сутки — <strong>4 000 ₽</strong> за одного человека.
              Курс общеукрепляющих процедур, прогулки на свежем воздухе у озера Чедер за несколько дней зарядят бодростью.
            </p>
          </Card>
          <Card className="border-0 shadow-md bg-gradient-to-r from-accent to-accent-light text-primary-dark hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            styles={{ body: { padding: '28px' } }}
          >
            <div className="flex items-center gap-3 mb-2">
              <FileTextOutlined className="text-xl" />
              <h3 className="text-xl font-bold">Дневное пребывание «Всё включено»</h3>
            </div>
            <p className="text-primary/80 text-sm leading-relaxed">
              Проведите время с 9:00 до 18:00 с пользой для здоровья. Стоимость — <strong>3 000 ₽</strong>.
              Включено: грязелечение, обед, минеральная ванна, размещение в уютном номере.
            </p>
          </Card>
        </div>
      </div>
    </section>
  );
}
