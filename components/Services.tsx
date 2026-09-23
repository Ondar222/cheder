import {
  MedicineBoxOutlined,
  ExperimentOutlined,
  EnvironmentOutlined,
  AimOutlined,
  UserOutlined,
  CoffeeOutlined,
  ThunderboltOutlined,
  SkinOutlined,
} from '@ant-design/icons';
import TiltCard from '@/components/TiltCard';

const services = [
  {
    icon: <MedicineBoxOutlined />,
    title: 'Грязелечение',
    desc: 'Лечебные грязи озера Чедер — уникальные природные лечебные грязи, используемые в комплексных программах санатория для восстановления физического и психического здоровья.',
    warm: false,
  },
  {
    icon: <ExperimentOutlined />,
    title: 'Минеральные ванны',
    desc: 'Подземные воды соленого озера Чедер используются как минеральные лечебные в комплексе с лечебными грязями для оздоровления организма.',
    warm: true,
  },
  {
    icon: <EnvironmentOutlined />,
    title: 'Аромафитотерапия',
    desc: 'Аромафитотерапия на дыхательную систему для общего укрепления организма и восстановления.',
    warm: false,
  },
  {
    icon: <ThunderboltOutlined />,
    title: 'Водолечебные процедуры',
    desc: 'Душ-шарко, циркулярный душ и восходящий душ. Повышение тонуса мускулатуры, работа с остеохондрозом позвоночника.',
    warm: true,
  },
  {
    icon: <AimOutlined />,
    title: 'Лечебная физкультура',
    desc: 'ЛФК — лечебная физкультура для восстановления физического и психического здоровья, поддержания тонуса и работоспособности.',
    warm: false,
  },
  {
    icon: <UserOutlined />,
    title: 'Приём терапевта',
    desc: 'Консультация и наблюдение врача-терапевта на протяжении всего курса лечения.',
    warm: false,
  },
  {
    icon: <SkinOutlined />,
    title: 'Физиотерапия',
    desc: 'Физиотерапия незаменима в период реабилитации, восстановления после различных заболеваний. Для профилактики обострений и укрепления организма.',
    warm: true,
  },
  {
    icon: <CoffeeOutlined />,
    title: 'Трёхразовое питание',
    desc: 'Вкусное и полезное питание, включённое в стоимость проживания. Обеденная зона комплекса.',
    warm: false,
  },
];

export default function Services() {
  return (
    <section id="services" className="relative py-20 sm:py-28 bg-bg-2/40">
      {/* Разделитель-линия */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[min(72rem,92%)] h-px bg-gradient-to-r from-transparent via-line to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14 reveal">
          <span className="hud-label">Услуги</span>
          <h2 className="font-display text-4xl sm:text-5xl font-medium text-ink mt-5 mb-4 leading-[1.1]">
            Комплексное <span className="italic text-neon">оздоровление</span>
          </h2>
          <p className="text-muted max-w-2xl mx-auto">
            Чистый воздух, целебная вода озера и лечебные грязи используются в комплексных
            программах санатория для восстановления физического и психического здоровья.
          </p>
        </div>

        {/* Стеклянные 3D-карточки */}
        <div className="scene-3d grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {services.map((s, i) => (
            <TiltCard
              key={i}
              maxTilt={8}
              className={`reveal reveal-3d r-${((i % 4) + 1) * 100} glass rounded-2xl p-5 h-full cursor-pointer group shadow-[0_10px_40px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_60px_rgba(124,217,190,0.1)]`}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl depth-1 transition-colors ${
                    s.warm
                      ? 'bg-warm/10 border border-warm/25 text-warm group-hover:bg-warm/20'
                      : 'bg-accent/10 border border-accent/25 text-accent group-hover:bg-accent/20'
                  }`}
                >
                  {s.icon}
                </div>
              </div>
              <h3 className="font-display text-xl font-semibold text-ink mb-2 leading-snug depth-1 italic">
                {s.title}
              </h3>
              <p className="text-muted text-[13px] leading-relaxed line-clamp-3 depth-1">{s.desc}</p>
            </TiltCard>
          ))}
        </div>
      </div>
    </section>
  );
}
