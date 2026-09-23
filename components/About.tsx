import { ApartmentOutlined, FallOutlined, EnvironmentOutlined, MedicineBoxOutlined, CoffeeOutlined, AppleOutlined } from '@ant-design/icons';
import TiltCard from '@/components/TiltCard';

const features = [
  { icon: <ApartmentOutlined />, label: 'Республика Тыва', desc: 'Холмистая равнина' },
  { icon: <FallOutlined />, label: 'Соленое озеро', desc: 'Лечебные грязи' },
  { icon: <EnvironmentOutlined />, label: 'Бальнеология', desc: 'Минеральные воды' },
  { icon: <MedicineBoxOutlined />, label: 'Санаторий', desc: 'Комплексное лечение' },
];

const cards = [
  { icon: <ApartmentOutlined />, title: 'Живописная природа', desc: 'Берег озера Чедер в Республике Тыва' },
  { icon: <CoffeeOutlined />, title: 'Комфортные номера', desc: 'Двухспальные кровати, уютная атмосфера' },
  { icon: <AppleOutlined />, title: 'Трёхразовое питание', desc: 'Вкусная и полезная еда включена в стоимость' },
  { icon: <EnvironmentOutlined />, title: 'Оздоровление', desc: 'Комплексные программы восстановления' },
];

export default function About() {
  return (
    <section id="about" className="relative py-20 sm:py-28">
      {/* Разделитель-линия */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[min(72rem,92%)] h-px bg-gradient-to-r from-transparent via-line to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-14 items-center">
          {/* Левая колонка — минимализм */}
          <div className="reveal">
            <span className="hud-label">О нас</span>
            <h2 className="font-display text-4xl sm:text-5xl font-medium text-ink mt-5 mb-7 leading-[1.1]">
              Курортно-оздоровительный <span className="italic text-neon">комплекс</span>
            </h2>

            <div className="space-y-4 text-muted leading-relaxed mb-9 text-[15px] max-w-xl">
              <p>
                Курорт «Чедер» размещается на берегу соленого озера Чедер в Кызылском кожууне Республики Тыва.
                Местность представлена холмистой безлесой равниной с благоприятными природно-климатическими условиями.
              </p>
              <p>
                Чистый воздух, целебная вода озера и лечебные грязи используются в комплексных программах
                санатория для восстановления физического и психического здоровья. Забудьте о городской суете
                и насладитесь спокойствием природы.
              </p>
              <p>
                Имеются широкие возможности для освоения бальнеологических ресурсов территории.
                Помимо ресурсного потенциала приоритетным направлением является развитие
                туристско-рекреационного и санаторно-курортного потенциала.
              </p>
            </div>

            {/* HUD-факты */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {features.map((item, i) => (
                <div
                  key={i}
                  className="glass rounded-xl p-3.5 text-center hover:border-accent/40 transition-colors group"
                >
                  <div className="mb-2 text-accent text-lg flex justify-center group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>
                  <div className="text-[13px] font-semibold text-ink leading-tight">{item.label}</div>
                  <div className="text-[11px] text-muted mt-0.5">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Правая колонка — 3D-карточки */}
          <div className="scene-3d reveal r-200">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                {cards.slice(0, 2).map((card, i) => (
                  <TiltCard
                    key={i}
                    className="glass rounded-2xl p-6 h-44 flex flex-col justify-end cursor-default shadow-[0_18px_50px_rgba(0,0,0,0.35)] hover:shadow-[0_24px_70px_rgba(124,217,190,0.12)]"
                  >
                    <div className="mb-2 text-accent text-2xl depth-1">{card.icon}</div>
                    <h4 className="font-display text-lg font-semibold text-ink leading-tight depth-1 italic">{card.title}</h4>
                    <p className="text-xs text-muted mt-1.5 depth-1">{card.desc}</p>
                  </TiltCard>
                ))}
              </div>
              <div className="space-y-4 pt-8">
                {cards.slice(2, 4).map((card, i) => (
                  <TiltCard
                    key={i}
                    className="glass rounded-2xl p-6 h-52 flex flex-col justify-end cursor-default shadow-[0_18px_50px_rgba(0,0,0,0.35)] hover:shadow-[0_24px_70px_rgba(232,207,158,0.12)]"
                  >
                    <div className={`mb-2 text-2xl depth-1 ${i % 2 === 0 ? 'text-warm' : 'text-accent'}`}>{card.icon}</div>
                    <h4 className="font-display text-lg font-semibold text-ink leading-tight depth-1 italic">{card.title}</h4>
                    <p className="text-xs text-muted mt-1.5 depth-1">{card.desc}</p>
                  </TiltCard>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
