import { Card, Row, Col } from 'antd';
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
    icon: <MedicineBoxOutlined className="text-2xl" />,
    title: 'Грязелечение',
    desc: 'Лечебные грязи озера Чедер — уникальные природные лечебные грязи, используемые в комплексных программах санатория для восстановления физического и психического здоровья.',
    color: '#2d6a4f',
  },
  {
    icon: <FallOutlined className="text-2xl" />,
    title: 'Минеральные ванны',
    desc: 'Подземные воды соленого озера Чедер используются как минеральные лечебные в комплексе с лечебными грязями для оздоровления организма.',
    color: '#40916c',
  },
  {
    icon: <EnvironmentOutlined className="text-2xl" />,
    title: 'Аромафитотерапия',
    desc: 'Аромафитотерапия на дыхательную систему для общего укрепления организма и восстановления.',
    color: '#52b788',
  },
  {
    icon: <FallOutlined className="text-2xl" />,
    title: 'Водолечебные процедуры',
    desc: 'Душ-шарко, циркулярный душ и восходящий душ. Душ Шарко предназначен для струевого, веерного и контрастного шотландского душей. Используется для повышения тонуса мускулатуры, при остеохондрозе позвоночника.',
    color: '#74c693',
  },
  {
    icon: <AimOutlined className="text-2xl" />,
    title: 'Лечебная физкультура',
    desc: 'ЛФК — лечебная физкультура для восстановления физического и психического здоровья, поддержания тонуса и работоспособности.',
    color: '#95d5b2',
  },
  {
    icon: <UserOutlined className="text-2xl" />,
    title: 'Приём терапевта',
    desc: 'Консультация и наблюдение врача-терапевта на протяжении всего курса лечения.',
    color: '#b7e4c7',
  },
  {
    icon: <AimOutlined className="text-2xl" />,
    title: 'Физиотерапия',
    desc: 'Физиотерапия незаменима в период реабилитации, восстановления после различных заболеваний. Для профилактики обострений и укрепления организма.',
    color: '#d8f3dc',
  },
  {
    icon: <CoffeeOutlined className="text-2xl" />,
    title: 'Трёхразовое питание',
    desc: 'Вкусное и полезное питание, включённое в стоимость проживания. Обеденная зона комплекса.',
    color: '#e9c46a',
  },
];

export default function Services() {
  return (
    <section id="services" className="py-20 sm:py-28 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16 fade-section">
          <span className="inline-block text-primary font-semibold text-sm tracking-wider uppercase mb-3">Наши услуги</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-primary-dark mb-4">
            Комплексное оздоровление
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Чистый воздух, целебная вода озера и лечебные грязи используются в комплексных программах 
            санатория для восстановления физического и психического здоровья.
          </p>
        </div>

        <Row gutter={[24, 24]}>
          {services.map((s, i) => (
            <Col xs={24} sm={12} lg={8} key={i}>
              <Card
                className="fade-section hover:shadow-xl transition-all duration-300 border-0 shadow-md h-full hover:-translate-y-1 cursor-pointer group"
                styles={{ body: { padding: '28px 24px' } }}
              >
                <div className="flex items-start gap-5">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-2xl transition-transform duration-300 group-hover:scale-110"
                    style={{ backgroundColor: `${s.color}20` }}
                  >
                    {s.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{s.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </section>
  );
}
