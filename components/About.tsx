import { Card } from 'antd';
import { ApartmentOutlined, FallOutlined, EnvironmentOutlined, MedicineBoxOutlined, CoffeeOutlined, AppleOutlined } from '@ant-design/icons';

const features = [
  { icon: <ApartmentOutlined className="text-2xl text-primary" />, label: 'Республика Тыва', desc: 'Холмистая равнина' },
  { icon: <FallOutlined className="text-2xl text-primary" />, label: 'Соленое озеро', desc: 'Лечебные грязи' },
  { icon: <EnvironmentOutlined className="text-2xl text-primary" />, label: 'Бальнеология', desc: 'Минеральные воды' },
  { icon: <MedicineBoxOutlined className="text-2xl text-primary" />, label: 'Санаторий', desc: 'Комплексное лечение' },
];

const cards = [
  { icon: <ApartmentOutlined className="text-3xl text-white/80" />, title: 'Живописная природа', desc: 'Берег озера Чедер в Республике Тыва', gradient: 'from-primary-dark to-primary', textColor: 'text-white' },
  { icon: <CoffeeOutlined className="text-3xl text-primary" />, title: 'Комфортные номера', desc: 'Двухспальные кровати, уютная атмосфера', gradient: 'from-accent to-accent-light', textColor: 'text-primary-dark' },
  { icon: <AppleOutlined className="text-3xl text-white/80" />, title: 'Трёхразовое питание', desc: 'Вкусная и полезная еда включена в стоимость', gradient: 'from-primary-light to-primary-dark', textColor: 'text-white' },
  { icon: <EnvironmentOutlined className="text-3xl text-white/80" />, title: 'Оздоровление', desc: 'Комплексные программы восстановления', gradient: 'from-primary to-primary-light', textColor: 'text-white' },
];

export default function About() {
  return (
    <section id="about" className="py-14 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          {/* Left — content */}
          <div className="fade-section">
            <span className="inline-block text-primary font-semibold text-sm tracking-wider uppercase mb-3">О нас</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-primary-dark mb-5 leading-tight">
              Курортно-оздоровительный комплекс
              <br />
              <span className="text-primary relative inline-block">
                «Чедер»
                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                  <path d="M2 10C50 2 100 2 150 6C200 10 250 4 298 6" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="text-primary-light"/>
                </svg>
              </span>
            </h2>
            
            <div className="space-y-3 text-gray-600 leading-relaxed mb-6 text-[15px]">
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

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {features.map((item, i) => (
                <div key={i} className="bg-surface rounded-xl p-3 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-1 cursor-default group">
                  <div className="mb-1.5 transition-transform duration-300 group-hover:scale-110">{item.icon}</div>
                  <div className="text-[13px] font-bold text-gray-900 leading-tight">{item.label}</div>
                  <div className="text-[11px] text-gray-500">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — visual cards */}
          <div className="fade-section">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-3">
                {cards.slice(0, 2).map((card, i) => (
                  <Card key={i} className={`rounded-2xl border-0 shadow-lg ${card.gradient} ${card.textColor} h-40 flex flex-col justify-end p-4 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-default`}>
                    <div className="mb-1.5">{card.icon}</div>
                    <h4 className="font-bold text-[15px] leading-tight">{card.title}</h4>
                    <p className={`text-xs ${card.textColor === 'text-white' ? 'text-white/70' : 'text-primary/70'} mt-1`}>{card.desc}</p>
                  </Card>
                ))}
              </div>
              <div className="space-y-3 pt-6">
                {cards.slice(2, 4).map((card, i) => (
                  <Card key={i} className={`rounded-2xl border-0 shadow-lg ${card.gradient} ${card.textColor} h-48 flex flex-col justify-end p-4 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-default`}>
                    <div className="mb-1.5">{card.icon}</div>
                    <h4 className="font-bold text-[15px] leading-tight">{card.title}</h4>
                    <p className={`text-xs ${card.textColor === 'text-white' ? 'text-white/70' : 'text-primary/70'} mt-1`}>{card.desc}</p>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
