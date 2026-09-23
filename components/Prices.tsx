'use client';

import { StarFilled, TagOutlined, FileTextOutlined, CheckOutlined } from '@ant-design/icons';

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
  },
];

export default function Prices() {
  return (
    <section id="prices" className="relative py-20 sm:py-28 overflow-hidden">
      {/* Разделитель-линия */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[min(72rem,92%)] h-px bg-gradient-to-r from-transparent via-line to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 reveal">
          <span className="hud-label">Стоимость</span>
          <h2 className="font-display text-4xl sm:text-5xl font-medium text-ink mt-5 mb-4 leading-[1.1]">
            Актуальные <span className="italic text-neon">цены</span>
          </h2>
          <p className="text-muted max-w-2xl mx-auto">
            В стоимость проживания включён полный комплекс оздоровительных процедур и трёхразовое питание.
          </p>
        </div>

        {/*
          Один ряд во всех версиях. На мобильных карточки в ряд и листаются
          свайпом (snap-карусель), от планшета — обычная сетка из трёх.
          На десктопе карточки стоят в 3D-перспективе (price-scene).
        */}
        <div className="sm:max-w-4xl lg:max-w-5xl mx-auto reveal r-200">
          <div className="price-scene -mx-4 sm:mx-0 pt-4 pb-6">
            <div className="flex sm:grid sm:grid-cols-3 gap-3 sm:gap-6 overflow-x-auto sm:overflow-visible no-scrollbar snap-x snap-proximity px-4 sm:px-0">
              {prices.map((p, i) => (
                <div
                  key={i}
                  className={`price-card fade-section h-full shrink-0 min-w-[62%] sm:shrink sm:min-w-0 snap-center relative rounded-2xl p-6 sm:p-7 flex flex-col text-center ${
                    p.highlight
                      ? 'glass-strong border-warm/40 shadow-[0_0_60px_rgba(232,207,158,0.12)]'
                      : 'glass shadow-[0_10px_40px_rgba(0,0,0,0.3)]'
                  }`}
                >
                  {p.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#f7ead0] to-warm text-[#1c1408] px-3.5 py-1 text-[10px] font-semibold tracking-[0.16em] uppercase">
                        <StarFilled className="text-[9px]" /> Рекомендуем
                      </span>
                    </div>
                  )}

                  <h3 className="text-[12px] tracking-[0.14em] uppercase text-muted mb-2">
                    {p.period}
                  </h3>
                  <div className="font-display italic text-4xl sm:text-[42px] font-semibold text-neon leading-tight whitespace-nowrap">
                    {p.price}
                  </div>
                  <div className="text-[11px] tracking-[0.14em] uppercase text-muted mb-5 mt-1">{p.perDay}</div>

                  {/* Компактный список на мобильных */}
                  <div className="border-t border-line pt-3 sm:hidden space-y-1.5 text-left mt-auto">
                    {p.included.slice(0, 4).map((item) => (
                      <div key={item} className="flex items-center gap-1.5 text-[11px] leading-tight text-ink/80">
                        <span className="w-3.5 h-3.5 min-w-[14px] rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0">
                          <CheckOutlined style={{ fontSize: 7 }} />
                        </span>
                        <span className="truncate">{item}</span>
                      </div>
                    ))}
                  </div>

                  {/* Полный список от планшета */}
                  <div className="hidden sm:block border-t border-line pt-4 space-y-2 text-left">
                    {p.included.map((item) => (
                      <div key={item} className="flex items-center gap-2.5 text-[13px] text-ink/85">
                        <span className="w-[18px] h-[18px] min-w-[18px] rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0">
                          <CheckOutlined style={{ fontSize: 9 }} />
                        </span>
                        {item}
                      </div>
                    ))}
                  </div>

                  <a href="tel:+79133405566" className="block mt-5 sm:mt-6">
                    <button
                      className={`w-full py-2.5 rounded-full font-semibold text-sm transition-all duration-300 ${
                        p.highlight
                          ? 'btn-neon !py-2.5'
                          : 'btn-ghost !py-2.5 hover:border-accent'
                      }`}
                    >
                      Забронировать
                    </button>
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Подсказка о свайпе — только на мобильных */}
          <div className="flex sm:hidden items-center justify-center gap-1.5 mt-1 text-[10px] tracking-[0.18em] uppercase text-muted/60">
            <span>←</span>
            <span>листайте, чтобы сравнить</span>
            <span>→</span>
          </div>
        </div>

        {/* Спец-предложения */}
        <div className="mt-16 grid sm:grid-cols-2 gap-5 reveal">
          <div className="glass rounded-2xl p-7 transition-all duration-300 hover:border-accent/40 group">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/25 flex items-center justify-center text-accent text-lg">
                <TagOutlined />
              </span>
              <h3 className="font-display text-xl font-semibold text-ink italic">Скидка для гостей 60+</h3>
            </div>
            <p className="text-muted text-sm leading-relaxed">
              Стоимость проживания в сутки — <strong className="text-accent-2">4 000 ₽</strong> за одного человека.
              Курс общеукрепляющих процедур, прогулки на свежем воздухе у озера Чедер за несколько дней зарядят бодростью.
            </p>
          </div>
          <div className="glass rounded-2xl p-7 transition-all duration-300 hover:border-warm/40 group">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-10 h-10 rounded-xl bg-warm/10 border border-warm/25 flex items-center justify-center text-warm text-lg">
                <FileTextOutlined />
              </span>
              <h3 className="font-display text-xl font-semibold text-ink italic">Дневное пребывание «Всё включено»</h3>
            </div>
            <p className="text-muted text-sm leading-relaxed">
              Проведите время с 9:00 до 18:00 с пользой для здоровья. Стоимость — <strong className="text-warm">3 000 ₽</strong>.
              Включено: грязелечение, обед, минеральная ванна, размещение в уютном номере.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
