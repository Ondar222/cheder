'use client';

import { ArrowDownOutlined, PhoneOutlined, PlayCircleOutlined, CheckOutlined } from '@ant-design/icons';
import { useEffect, useState, useRef } from 'react';
import Particles from '@/components/Particles';
import { useBooking } from '@/components/BookingProvider';

const videos = [
  { src: '/videos/video-main.mp4?t=1', title: 'Лечебные грязи озера Чедер', desc: 'Уникальные природные лечебные грязи с богатой минеральной историей', start: 0 },
  { src: '/videos/video-1.mp4?t=2', title: 'Живописная природа Тывы', desc: 'Холмистая равнина с благоприятными природно-климатическими условиями', start: 14 },
  { src: '/videos/video-2.mp4?t=3', title: 'Культура и традиции', desc: 'Погрузитесь в уникальную культуру Республики Тыва', start: 28 },
  { src: '/videos/video-3.mp4?t=4', title: 'Комплексное оздоровление', desc: 'Грязелечение, минеральные ванны, аромафитотерапия и ЛФК', start: 7 },
  { src: '/videos/video-4.mp4?t=5', title: 'Сезонные акции', desc: 'Выгодные цены на проживание и оздоровительные программы', start: 21 },
];

export default function Hero() {
  const { openBooking } = useBooking();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const sectionRef = useRef<HTMLElement>(null);

  // Параллакс: фон и контент движутся с разной скоростью
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = window.scrollY;
        if (y > window.innerHeight) return;
        el.style.setProperty('--parallax', `${y * 0.35}px`);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % videos.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (!video) return;
      if (index === currentSlide) {
        // Каждый слайд стартует со своей отметки, чтобы ролики
        // не начинались с одного и того же кадра
        const startAt = videos[index].start ?? 0;
        const seek = () => {
          if (Number.isFinite(video.duration) && video.duration > 0) {
            video.currentTime = startAt % video.duration;
          }
        };
        if (video.readyState >= 1) seek();
        else video.addEventListener('loadedmetadata', seek, { once: true });
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, [currentSlide]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 60000);
  };

  return (
    <section
      id="hero"
      ref={sectionRef}
      className="relative min-h-screen flex items-center overflow-hidden"
    >
      {/* Фоновое изображение с параллаксом */}
      {!videoError && (
        <div
          className="absolute inset-0 will-change-transform"
          style={{ transform: 'translateY(calc(var(--parallax, 0) * 0.6))' }}
        >
          <img
            src="/images/gallery/DJI_0595.png"
            alt="Здравница Чедер"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-[#050807]" />
        </div>
      )}

      {/* Видео-слайды с параллаксом */}
      {videos.map((video, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-[1500ms] will-change-transform ${
            index === currentSlide && !videoError ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ transform: 'translateY(calc(var(--parallax, 0) * 0.6))' }}
        >
          <video
            ref={(el) => { videoRefs.current[index] = el; }}
            className="absolute inset-0 w-full h-full object-cover"
            muted
            loop
            playsInline
            preload="metadata"
            onError={() => setVideoError(true)}
          >
            <source src={video.src} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/35 to-[#050807]" />
        </div>
      ))}

      {/* Живые «светлячки» над озером */}
      <Particles className="absolute inset-0 z-[5] w-full h-full pointer-events-none" />

      {/* Мягкое свечение рассвета */}
      <div className="absolute -top-40 left-1/4 w-[45vw] h-[45vw] rounded-full bg-accent/10 blur-[120px] pointer-events-none animate-glow" />
      <div className="absolute bottom-0 right-0 w-[40vw] h-[40vw] rounded-full bg-warm/8 blur-[130px] pointer-events-none" />

      {/* Контент */}
      <div
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-40 pb-28 w-full"
        style={{ transform: 'translateY(calc(var(--parallax, 0) * -0.15))' }}
      >
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7">
            {/* Мягкий бейдж */}
            <div className="inline-flex items-center gap-2.5 glass rounded-full px-4 py-2 mb-8 animate-fade-in">
              <span className="relative flex w-2 h-2">
                <span className="absolute inline-flex w-full h-full rounded-full bg-accent opacity-75 animate-ping" />
                <span className="relative inline-flex w-2 h-2 rounded-full bg-accent" />
              </span>
              <span className="text-[12px] tracking-[0.18em] uppercase text-accent-2">Санаторий у солёного озера</span>
            </div>

            <h1 className="font-display text-5xl sm:text-6xl lg:text-[76px] font-medium leading-[1.02] mb-7 text-ink">
              Тишина, вода
              <br />
              <span className="italic text-neon">и время для себя</span>
              <br />
              <span className="text-3xl sm:text-4xl lg:text-[42px] text-warm italic font-normal">на берегу озера Чедер</span>
            </h1>

            <p className="text-lg text-muted mb-10 max-w-xl leading-relaxed">
              Целебные грязи, минеральные воды и простор тувинской степи —
              оздоровление, в котором технологии остаются на втором плане.
            </p>

            <div className="flex flex-wrap gap-4">
              <button className="btn-neon" onClick={() => openBooking({ source: 'hero' })}>
                <PhoneOutlined /> Забронировать
              </button>
              <button className="btn-ghost">
                <PlayCircleOutlined /> Рекламный ролик
              </button>
            </div>

            {/* Тёплая статистика */}
            <div className="flex flex-wrap gap-x-12 gap-y-4 mt-14">
              {[
                { value: 'от 3 500₽', label: 'за сутки, всё включено' },
                { value: '690 м', label: 'высота над уровнем моря' },
                { value: '24/7', label: 'забота о вашем покое' },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="font-display text-[26px] font-semibold text-neon italic">{stat.value}</div>
                  <div className="text-[11px] tracking-[0.14em] uppercase text-muted mt-1.5">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Slide counter */}
            <div className="flex items-center gap-3 mt-10">
              {videos.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`h-1 rounded-full transition-all duration-300 ${
                    index === currentSlide ? 'w-10 bg-accent shadow-[0_0_10px_rgba(124,217,190,0.7)]' : 'w-4 bg-white/20 hover:bg-white/40'
                  }`}
                  aria-label={`Слайд ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Правая стеклянная карта */}
          <div className="hidden lg:block lg:col-span-5 animate-fade-in">
            <div className="hud glass-strong rounded-3xl p-8 max-w-md ml-auto animate-float-y">
              <div className="flex items-center justify-between mb-6">
                <span className="text-[11px] tracking-[0.24em] uppercase text-accent">Всё включено</span>
                <span className="w-2 h-2 rounded-full bg-accent animate-glow" />
              </div>
              <h3 className="font-display text-2xl font-semibold text-ink mb-4 italic">
                Комплексное оздоровление
              </h3>
              <p className="text-muted text-sm mb-6 leading-relaxed">
                Грязелечение, минеральные ванны, аромафитотерапия и приём терапевта —
                обо всём позаботились мы.
              </p>
              <div className="space-y-3">
                {[
                  'Лечебные грязи озера Чедер',
                  'Минеральные ванны',
                  'Аромафитотерапия',
                  'Лечебная физкультура',
                  'Трёхразовое питание',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm text-ink/90">
                    <span className="w-5 h-5 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shrink-0">
                      <CheckOutlined style={{ fontSize: 10 }} />
                    </span>
                    {item}
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-5 border-t border-line text-[11px] tracking-[0.2em] uppercase text-muted/80">
                Весна 2026 · места есть
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-accent/70 animate-bounce z-10">
        <ArrowDownOutlined style={{ fontSize: 26 }} />
      </div>
    </section>
  );
}
