import Header from '@/components/Header';
import Hero from '@/components/Hero';
import About from '@/components/About';
import Services from '@/components/Services';
import Prices from '@/components/Prices';
import Gallery from '@/components/Gallery';
import News from '@/components/News';
import FAQ from '@/components/FAQ';
import Contacts from '@/components/Contacts';
import Footer from '@/components/Footer';
import ScrollAnimations from '@/components/ScrollAnimations';

/** Бегущая строка-разделитель между секциями */
function Marquee() {
  const items = ['Тишина', 'Озеро Чедер', 'Тепло', 'Забота', 'Природа', 'Гармония', 'Целебная вода'];
  const row = (
    <>
      {items.map((item) => (
        <span key={item} className="flex items-center gap-12 shrink-0">
          <span className="font-display italic text-3xl sm:text-5xl font-medium text-ink/25 whitespace-nowrap">
            {item}
          </span>
          <span className="w-1.5 h-1.5 rotate-45 bg-warm/50 shadow-[0_0_10px_rgba(232,207,158,0.6)]" />
        </span>
      ))}
    </>
  );
  return (
    <div className="relative py-14 sm:py-20 border-y border-line overflow-hidden select-none" aria-hidden="true">
      <div className="absolute inset-0 bg-gradient-to-r from-accent/[0.03] via-transparent to-warm/[0.04]" />
      <div className="marquee relative">
        <div className="marquee-track">{row}</div>
        <div className="marquee-track" aria-hidden="true">{row}</div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="relative">
      <ScrollAnimations />
      <Header />
      <Hero />
      <Marquee />
      <About />
      <Services />
      <Marquee />
      <Prices />
      <Gallery />
      <News />
      <FAQ />
      <Contacts />
      <Footer />
    </main>
  );
}