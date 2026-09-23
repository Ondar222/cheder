'use client';

import { useState } from 'react';
import { QuestionCircleOutlined, PlusOutlined } from '@ant-design/icons';

const faqData = [
  {
    key: '1',
    q: 'Какова стоимость проживания в здравнице Чедер?',
    a: 'Постоянная цена за сутки пребывания составляет 5 000 рублей. В пакет включено: трёхразовое питание, проживание в уютном номере, оздоровительные процедуры грязевых и минеральных ванн. Действуют сезонные акции: зимой — 3 500₽, весной — 3 990₽.',
  },
  {
    key: '2',
    q: 'Есть ли акция на бронирование отдыха?',
    a: 'Да, действует акция «Раннее бронирование» — 5 000 рублей за сутки на летний сезон. Для гостей 60+ специальная цена 4 000 рублей в сутки. Также есть акция «Дневное пребывание всё включено» — 3 000 рублей.',
  },
  {
    key: '3',
    q: 'Какие водолечебные процедуры предлагает здравница?',
    a: 'Водолечебные процедуры: душ-шарко, циркулярный душ и восходящий душ. Душ Шарко предназначен для проведения струевого, веерного и контрастного шотландского душей. Используется для повышения тонуса мускулатуры, уменьшения толщины жирового слоя, при остеохондрозе позвоночника.',
  },
  {
    key: '4',
    q: 'Как можно стать массажистом в здравнице Чедер?',
    a: 'Отправляйте свое резюме на электронную почту info.cheder@yandex.ru. В санатории требуются массажисты и медсестры физиотерапевтического кабинета. Удобный график работы, бесплатное проживание и питание.',
  },
  {
    key: '5',
    q: 'Как оцениваются отзывы гостей здравницы Чедер?',
    a: 'Мы внимательно изучаем каждое сообщение, будь то восторженная похвала или конструктивная критика. Ваши оценки отражают подлинный опыт посетителей, которые уже насладились нашим сервисом. Это помогает нам постоянно совершенствовать уровень обслуживания.',
  },
  {
    key: '6',
    q: 'Что входит в стоимость проживания?',
    a: 'В стоимость входит: проживание в комфортных номерах, трёхразовое питание, грязелечение, минеральная ванна, аромафитотерапия на дыхательную систему, ЛФК, приём терапевта.',
  },
  {
    key: '7',
    q: 'Где находится здравница Чедер?',
    a: 'Курорт «Чедер» размещается на берегу соленого озера Чедер в Кызылском кожууне Республики Тыва. Отдел продаж: г. Кызыл, ул. Интернациональная, 106. Тел: +7 (913) 340-55-66.',
  },
  {
    key: '8',
    q: 'Как забронировать путёвку?',
    a: 'Бронирование подтверждается после предоплаты в размере 100% от стоимости путёвки. Позвоните в отдел продаж: +7 (913) 340-55-66. Также доступно онлайн-бронирование в приложении Yurta App (iOS, Android).',
  },
  {
    key: '9',
    q: 'Какие документы нужны для заселения?',
    a: 'Необходимые документы: паспорт РФ или загранпаспорт, санаторно-курортная карта (оформляется по месту жительства или в санатории за доплату). Заезд с 09:00-11:00, выезд до 11:00.',
  },
  {
    key: '10',
    q: 'Есть ли представительства в других городах?',
    a: 'Да, для жителей Красноярского края и Новосибирской области открыты представительства: в Красноярске (пр. Красноярский Рабочий, 59), в Абакане, в других городах. Подробности по телефону +7 (913) 340-55-66.',
  },
];

export default function FAQ() {
  const [activeKey, setActiveKey] = useState<string | null>(null);

  return (
    <section id="faq" className="relative py-20 sm:py-28">
      {/* Разделитель-линия */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[min(72rem,92%)] h-px bg-gradient-to-r from-transparent via-line to-transparent" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10 reveal">
          <span className="hud-label">Частые вопросы</span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-ink mt-5 mb-4">
            Часто задаваемые <span className="text-neon">вопросы</span>
          </h2>
          <p className="text-muted">Ответы на самые популярные вопросы о нашем санатории</p>
        </div>

        {/* Техно-минимализм: список с монолитными строками */}
        <div className="reveal r-200 border-t border-line">
          {faqData.map((item, i) => {
            const isOpen = activeKey === item.key;
            return (
              <div key={item.key} className="border-b border-line">
                <button
                  onClick={() => setActiveKey(isOpen ? null : item.key)}
                  aria-expanded={isOpen}
                  className="group flex w-full items-center gap-4 py-5 text-left transition-colors"
                >
                  <span className="font-mono-hud text-[10px] text-accent/50 shrink-0 w-7">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className={`flex-1 text-[15px] font-medium leading-snug transition-colors ${isOpen ? 'text-accent' : 'text-ink group-hover:text-accent-2'}`}>
                    {item.q}
                  </span>
                  <span
                    className={`shrink-0 w-8 h-8 rounded-full glass flex items-center justify-center text-accent transition-all duration-300 ${
                      isOpen ? 'rotate-45 border-accent/50 bg-accent/10' : 'group-hover:border-accent/40'
                    }`}
                  >
                    <PlusOutlined className="text-xs" />
                  </span>
                </button>
                <div
                  className={`grid transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="flex gap-4 pb-6 pl-11 pr-10">
                      <QuestionCircleOutlined className="text-accent/40 text-sm mt-0.5 shrink-0" />
                      <p className="text-muted text-sm leading-relaxed">{item.a}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
