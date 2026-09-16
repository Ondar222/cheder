'use client';

import { Card, Tag, Row, Col } from 'antd';
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
    <section id="prices" className="py-20 sm:py-28 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16 fade-section">
          <span className="inline-block text-primary font-semibold text-sm tracking-wider uppercase mb-3">Стоимость</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-primary-dark mb-4">
            Актуальные цены
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            В стоимость проживания включён полный комплекс оздоровительных процедур и трёхразовое питание.
          </p>
        </div>

        <Row gutter={[24, 24]} justify="center">
          {prices.map((p, i) => (
            <Col xs={24} sm={12} lg={7} key={i}>
              <Card
                className={`fade-section h-full border-0 shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${p.highlight ? 'ring-2 ring-primary relative' : ''}`}
                styles={{ body: { padding: '32px 24px' } }}
              >
                {p.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Tag color="primary" className="px-4 py-1 rounded-full text-sm font-semibold">
                      Лучшая цена
                    </Tag>
                  </div>
                )}
                <div className="text-center">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{p.period}</h3>
                  {p.highlight && (
                    <div className="flex items-center justify-center gap-1 mb-3">
                      {[...Array(5)].map((_, j) => (
                        <StarFilled key={j} className="text-accent text-sm" />
                      ))}
                    </div>
                  )}
                  <div className="text-4xl font-bold text-primary mb-1">{p.price}</div>
                  <div className="text-gray-500 text-sm mb-6">{p.perDay}</div>

                  <div className="border-t border-gray-100 pt-5 space-y-3 text-left">
                    {p.included.map((item) => (
                      <div key={item} className="flex items-center gap-2.5 text-sm text-gray-700">
                        <span
                          className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0"
                          style={{ backgroundColor: p.color }}
                        >
                          ✓
                        </span>
                        {item}
                      </div>
                    ))}
                  </div>

                  <a href="tel:+79133405566" className="block mt-6">
                    <button
                      className={`w-full py-2.5 rounded-full font-semibold text-base transition-all duration-300 hover:-translate-y-0.5 shadow-md hover:shadow-lg ${
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
            </Col>
          ))}
        </Row>

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
