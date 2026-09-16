import { Card } from 'antd';
import {
  MedicineBoxOutlined,
  FallOutlined,
  EnvironmentOutlined,
  AimOutlined,
  UserOutlined,
  CoffeeOutlined,
} from '@ant-design/icons';

const services = [
  {
    icon: <MedicineBoxOutlined className="text-xl" />,
    title: 'Грязелечение',
    desc: 'Лечебные грязи озера Чедер — уникальные природные лечебные грязи, используемые в комплексных программах санатория для восстановления физического и психического здоровья.',
    color: '#2d6a4f',
  },
  {
    icon: <FallOutlined className="text-xl" />,
    title: 'Минеральные ванны',
    desc: 'Подземные воды соленого озера Чедер используются как минеральные лечебные в комплексе с лечебными грязями для оздоровления организма.',
    color: '#40916c',
  },
  {
    icon: <EnvironmentOutlined className="text-xl" />,
    title: 'Аромафитотерапия',
    desc: 'Аромафитотерапия на дыхательную систему для общего укрепления организма и восстановления.',
    color: '#52b788',
  },
  {
    icon: <FallOutlined className="text-xl" />,
    title: 'Водолечебные процедуры',
    desc: 'Душ-шарко, циркулярный душ и восходящий душ. Душ Шарко предназначен для струевого, веерного и контрастного шотландского душей. Используется для повышения тонуса мускулатуры, при остеохондрозе позвоночника.',
    color: '#74c693',
  },
  {
    icon: <AimOutlined className="text-xl" />,
    title: 'Лечебная физкультура',
    desc: 'ЛФК — лечебная физкультура для восстановления физического и психического здоровья, поддержания тонуса и работоспособности.',
    color: '#95d5b2',
  },
  {
    icon: <UserOutlined className="text-xl" />,
    title: 'Приём терапевта',
    desc: 'Консультация и наблюдение врача-терапевта на протяжении всего курса лечения.',
    color: '#b7e4c7',
  },
  {
    icon: <AimOutlined className="text-xl" />,
    title: 'Физиотерапия',
    desc: 'Физиотерапия незаменима в период реабилитации, восстановления после различных заболеваний. Для профилактики обострений и укрепления организма.',
    color: '#d8f3dc',
  },
  {
    icon: <CoffeeOutlined className="text-xl" />,
    title: 'Трёхразовое питание',
    desc: 'Вкусное и полезное питание, включённое в стоимость проживания. Обеденная зона комплекса.',
    color: '#e9c46a',
  },
];

export default function Services() {
  return (
    <section id="services" className="py-14 sm:py-20 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10 fade-section">
          <span className="inline-block text-primary font-semibold text-sm tracking-wider uppercase mb-3">Наши услуги</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-primary-dark mb-3">
            Комплексное оздоровление
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Чистый воздух, целебная вода озера и лечебные грязи используются в комплексных программах 
            санатория для восстановления физического и психического здоровья.
          </p>
        </div>

        {/* Сетка на Tailwind: карточки стоят рядами сразу, без ожидания JS-стилей antd */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {services.map((s, i) => (
            <Card
              key={i}
              className="fade-section h-full border-0 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group"
              styles={{ body: { padding: '18px 18px' } }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-3.5 transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundColor: `${s.color}25`, color: s.color }}
              >
                {s.icon}
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1.5 leading-snug">{s.title}</h3>
              <p className="text-gray-600 text-[13px] leading-relaxed line-clamp-3">{s.desc}</p>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
