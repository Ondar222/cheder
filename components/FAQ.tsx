import { Collapse } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';

const faqData = [
  {
    key: '1',
    label: (
      <span className="font-semibold text-gray-900">
        <QuestionCircleOutlined className="text-primary mr-2" />
        Какова стоимость проживания в здравнице Чедер?
      </span>
    ),
    children: 'Постоянная цена за сутки пребывания составляет 5 000 рублей. В пакет включено: трёхразовое питание, проживание в уютном номере, оздоровительные процедуры грязевых и минеральных ванн. Действуют сезонные акции: зимой — 3 500₽, весной — 3 990₽.',
  },
  {
    key: '2',
    label: (
      <span className="font-semibold text-gray-900">
        <QuestionCircleOutlined className="text-primary mr-2" />
        Есть ли акция на бронирование отдыха?
      </span>
    ),
    children: 'Да, действует акция «Раннее бронирование» — 5 000 рублей за сутки на летний сезон. Для гостей 60+ специальная цена 4 000 рублей в сутки. Также есть акция «Дневное пребывание всё включено» — 3 000 рублей.',
  },
  {
    key: '3',
    label: (
      <span className="font-semibold text-gray-900">
        <QuestionCircleOutlined className="text-primary mr-2" />
        Какие водолечебные процедуры предлагает здравница?
      </span>
    ),
    children: 'Водолечебные процедуры: душ-шарко, циркулярный душ и восходящий душ. Душ Шарко предназначен для проведения струевого, веерного и контрастного шотландского душей. Используется для повышения тонуса мускулатуры, уменьшения толщины жирового слоя, при остеохондрозе позвоночника.',
  },
  {
    key: '4',
    label: (
      <span className="font-semibold text-gray-900">
        <QuestionCircleOutlined className="text-primary mr-2" />
        Как можно стать массажистом в здравнице Чедер?
      </span>
    ),
    children: 'Отправляйте свое резюме на электронную почту info.cheder@yandex.ru. В санатории требуются массажисты и медсестры физиотерапевтического кабинета. Удобный график работы, бесплатное проживание и питание.',
  },
  {
    key: '5',
    label: (
      <span className="font-semibold text-gray-900">
        <QuestionCircleOutlined className="text-primary mr-2" />
        Как оцениваются отзывы гостей здравницы Чедер?
      </span>
    ),
    children: 'Мы внимательно изучаем каждое сообщение, будь то восторженная похвала или конструктивная критика. Ваши оценки отражают подлинный опыт посетителей, которые уже насладились нашим сервисом. Это помогает нам постоянно совершенствовать уровень обслуживания.',
  },
  {
    key: '6',
    label: (
      <span className="font-semibold text-gray-900">
        <QuestionCircleOutlined className="text-primary mr-2" />
        Что входит в стоимость проживания?
      </span>
    ),
    children: 'В стоимость входит: проживание в комфортных номерах, трёхразовое питание, грязелечение, минеральная ванна, аромафитотерапия на дыхательную систему, ЛФК, приём терапевта.',
  },
  {
    key: '7',
    label: (
      <span className="font-semibold text-gray-900">
        <QuestionCircleOutlined className="text-primary mr-2" />
        Где находится здравница Чедер?
      </span>
    ),
    children: 'Курорт «Чедер» размещается на берегу соленого озера Чедер в Кызылском кожууне Республики Тыва. Отдел продаж: г. Кызыл, ул. Интернациональная, 106. Тел: +7 (913) 340-55-66.',
  },
  {
    key: '8',
    label: (
      <span className="font-semibold text-gray-900">
        <QuestionCircleOutlined className="text-primary mr-2" />
        Как забронировать путёвку?
      </span>
    ),
    children: 'Бронирование подтверждается после предоплаты в размере 100% от стоимости путёвки. Позвоните в отдел продаж: +7 (913) 340-55-66. Также доступно онлайн-бронирование в приложении Yurta App (iOS, Android).',
  },
  {
    key: '9',
    label: (
      <span className="font-semibold text-gray-900">
        <QuestionCircleOutlined className="text-primary mr-2" />
        Какие документы нужны для заселения?
      </span>
    ),
    children: 'Необходимые документы: паспорт РФ или загранпаспорт, санаторно-курортная карта (оформляется по месту жительства или в санатории за доплату). Заезд с 09:00-11:00, выезд до 11:00.',
  },
  {
    key: '10',
    label: (
      <span className="font-semibold text-gray-900">
        <QuestionCircleOutlined className="text-primary mr-2" />
        Есть ли представительства в других городах?
      </span>
    ),
    children: 'Да, для жителей Красноярского края и Новосибирской области открыты представительства: в Красноярске (пр. Красноярский Рабочий, 59), в Абакане, в других городах. Подробности по телефону +7 (913) 340-55-66.',
  },
];

export default function FAQ() {
  return (
    <section id="faq" className="py-14 sm:py-20 bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-8 fade-section">
          <span className="inline-block text-primary font-semibold text-sm tracking-wider uppercase mb-3">ЧаВо</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-primary-dark mb-3">
            Часто задаваемые вопросы
          </h2>
          <p className="text-gray-600">
            Ответы на самые популярные вопросы о нашем санатории
          </p>
        </div>

        <div className="fade-section">
          <Collapse
            items={faqData}
            bordered={false}
            className="shadow-md rounded-2xl overflow-hidden bg-white"
            expandIconPlacement="end"
            ghost
            styles={{
              header: { 
                backgroundColor: 'transparent',
                padding: '15px 18px',
                fontSize: '15px',
              },
              body: { 
                padding: '0 18px 16px',
                backgroundColor: '#f9fafb',
                fontSize: '14px',
              },
            }}
          />
        </div>
      </div>
    </section>
  );
}
