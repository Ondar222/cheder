'use client';

import { Button } from 'antd';
import { ArrowDownOutlined, PhoneOutlined, PlayCircleOutlined, EnvironmentOutlined } from '@ant-design/icons';
import { useEffect, useState, useRef } from 'react';

const videos = [
  { src: '/videos/video-main.mp4?t=1', title: 'Лечебные грязи озера Чедер', desc: 'Уникальные природные лечебные грязи с богатой минеральной историей' },
  { src: '/videos/video-1.mp4?t=2', title: 'Живописная природа Тывы', desc: 'Холмистая равнина с благоприятными природно-климатическими условиями' },
  { src: '/videos/video-2.mp4?t=3', title: 'Культура и традиции', desc: 'Погрузитесь в уникальную культуру Республики Тыва' },
  { src: '/videos/video-3.mp4?t=4', title: 'Комплексное оздоровление', desc: 'Грязелечение, минеральные ванны, аромафитотерапия и ЛФК' },
  { src: '/videos/video-4.mp4?t=5', title: 'Сезонные акции', desc: 'Выгодные цены на проживание и оздоровительные программы' },
];

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [videoError, setVideoError] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % videos.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  useEffect(() => {
    videoRefs.current.forEach((video, index) => {
      if (video) {
        if (index === currentSlide) {
          video.play().catch(() => {});
          video.currentTime = 0;
        } else {
          video.pause();
        }
      }
    });
  }, [currentSlide]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 60000);
  };

  return (
    <section id="hero" className="relative min-h-screen flex items-center overflow-hidden">
      {/* Hero background image */}
      {!videoError && (
        <div className="absolute inset-0">
          <img
            src="/images/gallery/DJI_0595.png"
            alt="Здравница Чедер"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-primary-dark/85 via-primary-dark/60 to-transparent" />
        </div>
      )}
      {/* Video Slides */}
      {videos.map((video, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1500 ${
            index === currentSlide && !videoError ? 'opacity-100' : 'opacity-0'
          }`}
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
          {/* Dark overlay with gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary-dark/85 via-primary-dark/60 to-transparent" />
        </div>
      ))}

      {/* Floating orbs */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-accent/20 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary-light/20 rounded-full blur-3xl animate-float-delay" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-32 w-full">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-white animate-fade-in-up">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              Санаторно-курортный комплекс
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Курорт <span className="text-accent-light">«Чедер»</span>
              <br />
              <span className="text-xl sm:text-2xl font-normal text-white/90">
                Республика Тыва • Соленое озеро • Лечебные грязи
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-white/85 mb-8 max-w-xl leading-relaxed">
              Курортно-оздоровительный комплекс на берегу соленого озера Чедер в Кызылском кожууне. 
              Уникальные лечебные грязи, минеральные воды, грязелечение и комплексные программы 
              восстановления физического и психического здоровья.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button
                size="large"
                className="bg-accent hover:bg-accent-light text-primary-dark border-0 rounded-full px-8 font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5"
                onClick={() => document.getElementById('contacts')?.scrollIntoView({ behavior: 'smooth' })}
              >
                <PhoneOutlined /> Забронировать
              </Button>
              <Button
                size="large"
                icon={<PlayCircleOutlined />}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 rounded-full px-6 font-medium text-base backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
              >
                Рекламный ролик
              </Button>
            </div>

            {/* Slide counter */}
            <div className="flex items-center gap-3 mt-10">
              {videos.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToSlide(index)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === currentSlide ? 'w-8 bg-accent' : 'w-4 bg-white/30 hover:bg-white/50'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Right side — decorative card */}
          <div className="hidden lg:block animate-fade-in-up delay-200">
            <div className="rounded-3xl p-8 text-gray-800 shadow-2xl max-w-md ml-auto backdrop-blur-md bg-white/10 border border-white/20 hover:bg-white/15 transition-all duration-300">
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-5">
                <EnvironmentOutlined className="text-3xl text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Комплексное оздоровление</h3>
              <p className="text-white/80 mb-5 leading-relaxed">
                Грязелечение, минеральные ванны, аромафитотерапия, ЛФК и приём терапевта — всё включено в стоимость.
              </p>
              <div className="space-y-3">
                {[
                  'Лечебные грязи озера Чедер',
                  'Минеральные ванны',
                  'Аромафитотерапия',
                  'Лечебная физкультура',
                  'Приём терапевта',
                  'Трёхразовое питание',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3 text-sm text-white/90">
                    <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-white text-xs shrink-0">✓</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/60 animate-bounce">
        <ArrowDownOutlined style={{ fontSize: 28 }} />
      </div>
    </section>
  );
}
