'use client';

import { CameraOutlined, VideoCameraOutlined, EnvironmentOutlined, MedicineBoxOutlined, CoffeeOutlined } from '@ant-design/icons';
import { useState } from 'react';

const photos = [
  {
    src: '/images/gallery/DJI_0595.png',
    title: 'Озеро Чедер',
    category: 'Природа',
    icon: <EnvironmentOutlined className="text-lg" />,
  },
  {
    src: '/images/gallery/DJI_0564.png',
    title: 'A-frame домики',
    category: 'Природа',
    icon: <EnvironmentOutlined className="text-lg" />,
  },
  {
    src: '/images/gallery/DJI_0585.png',
    title: 'Территория санатория',
    category: 'Природа',
    icon: <EnvironmentOutlined className="text-lg" />,
  },
  {
    src: '/images/gallery/IMG_1803.jpeg',
    title: 'Вид на комплекс',
    category: 'Природа',
    icon: <EnvironmentOutlined className="text-lg" />,
  },
  {
    src: '/images/gallery/DJI_0287.jpg',
    title: 'Главный корпус',
    category: 'Природа',
    icon: <EnvironmentOutlined className="text-lg" />,
  },
  {
    src: '/images/gallery/DJI_0313.jpg',
    title: 'Корпус с озера',
    category: 'Природа',
    icon: <EnvironmentOutlined className="text-lg" />,
  },
  {
    src: '/images/rooms/room-1.png',
    title: 'Двухместный номер',
    category: 'Номера',
    icon: <CameraOutlined className="text-lg" />,
  },
  {
    src: '/images/rooms/room-2.png',
    title: 'Односпальный номер',
    category: 'Номера',
    icon: <CameraOutlined className="text-lg" />,
  },
  {
    src: '/images/rooms/room-3.png',
    title: 'Номер с двумя кроватями',
    category: 'Номера',
    icon: <CameraOutlined className="text-lg" />,
  },
  {
    src: '/images/gallery/IMG_1917.jpeg',
    title: 'Гидромассажная ванна',
    category: 'Медицина',
    icon: <MedicineBoxOutlined className="text-lg" />,
  },
  {
    src: '/images/gallery/2dccb391-652d-42e9-91d3-d5d630dde6da.jpg',
    title: 'Столовая',
    category: 'Медицина',
    icon: <CoffeeOutlined className="text-lg" />,
  },
  {
    src: '/images/gallery/DJI_0295.jpg',
    title: 'Вид на комплекс',
    category: 'Природа',
    icon: <EnvironmentOutlined className="text-lg" />,
  },
];

const videos = [
  {
    title: 'Рекламный ролик «Здравница Чедер»',
    date: 'Февраль 2026',
    desc: 'Санаторий «Чедер»: заботимся о вашем здоровье!',
  },
  {
    title: 'Обзор столовой',
    date: 'Январь 2026',
    desc: 'Трёхразовое питание включено в стоимость проживания',
  },
  {
    title: 'Физиотерапия',
    date: 'Январь 2026',
    desc: 'Незаменима в период реабилитации и восстановления',
  },
];

export default function Gallery() {
  const [activeFilter, setActiveFilter] = useState('Все');
  const [modalOpen, setModalOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState('');
  const categories = ['Все', 'Природа', 'Номера', 'Медицина'];

  const filteredPhotos = activeFilter === 'Все'
    ? photos
    : photos.filter(p => p.category === activeFilter);

  const openImage = (src: string) => {
    setCurrentImage(src);
    setModalOpen(true);
  };

  return (
    <section id="gallery" className="relative py-20 sm:py-28 bg-bg-2/40">
      {/* Разделитель-линия */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[min(72rem,92%)] h-px bg-gradient-to-r from-transparent via-line to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Заголовок */}
        <div className="text-center mb-10 reveal">
          <span className="hud-label">Галерея</span>
          <h2 className="font-display text-4xl sm:text-5xl font-medium text-ink mt-5 mb-4 leading-[1.1]">
            Жизнь курорта <span className="italic text-neon">«Чедер»</span>
          </h2>
          <p className="text-muted max-w-2xl mx-auto">
            Фотографии и видео из жизни здравницы. Озёра, горы, лечебные процедуры и праздники — всё это Чедер.
          </p>
        </div>

        {/* Фотогалерея */}
        <div className="reveal r-200">
          {/* Фильтры */}
          <div className="flex flex-wrap justify-center gap-2.5 mb-8">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`px-5 py-2 rounded-full text-[13px] font-medium transition-all duration-300 ${
                  activeFilter === cat
                    ? 'bg-gradient-to-r from-[#fdf6e7] to-accent-2 text-[#0b231b] shadow-[0_0_24px_rgba(124,217,190,0.25)] scale-105'
                    : 'glass text-muted hover:text-ink hover:border-accent/40'
                }`}
              >
                {cat}
                {activeFilter === cat && (
                  <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-[#0b231b]/60 animate-pulse" />
                )}
              </button>
            ))}
          </div>

          {/* Сетка фото — 3D-tilt при наведении */}
          <div className="scene-3d grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3 mb-14">
            {filteredPhotos.map((photo, index) => (
              <div
                key={index}
                className="gallery-item group relative overflow-hidden rounded-xl glass cursor-pointer aspect-square shadow-[0_8px_30px_rgba(0,0,0,0.35)] hover:shadow-[0_20px_50px_rgba(46,230,184,0.15)]"
                onClick={() => openImage(photo.src)}
              >
                <img
                  src={photo.src}
                  alt={photo.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                {/* Затемнение с HUD-данными */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <div className="flex items-center gap-1.5 text-accent text-[10px] font-mono-hud mb-1">
                      {photo.icon}
                      <span>{photo.category}</span>
                    </div>
                    <h3 className="text-white font-semibold text-xs leading-tight">{photo.title}</h3>
                  </div>
                  <div className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-accent animate-glow opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Видео */}
        <div className="reveal">
          <div className="flex items-center gap-2.5 mb-6">
            <VideoCameraOutlined className="text-lg text-accent" />
            <h3 className="font-display text-2xl font-semibold text-ink italic">Видео</h3>
          </div>

          <div className="scene-3d grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((video, index) => (
              <div
                key={index}
                className="gallery-item group relative rounded-2xl overflow-hidden glass cursor-pointer shadow-[0_10px_40px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_60px_rgba(124,217,190,0.12)]"
              >
                <div className="relative overflow-hidden aspect-video bg-gradient-to-br from-[#12201a] to-[#0d1a14] flex items-center justify-center">
                  {/* Мягкая рамка-виньетка */}
                  <div className="absolute inset-4 rounded-xl border border-accent/12" />
                  <span className="text-[11px] tracking-[0.2em] uppercase text-accent/50 mb-10">{video.date}</span>
                  <div className="w-14 h-14 rounded-full bg-accent/10 border border-accent/40 flex items-center justify-center backdrop-blur-sm group-hover:bg-accent/25 group-hover:scale-110 transition-all duration-300 shadow-[0_0_30px_rgba(124,217,190,0.2)]">
                    <VideoCameraOutlined className="text-xl text-accent" />
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 text-[11px] tracking-[0.14em] uppercase text-muted mb-1.5">
                    <CameraOutlined /> {video.date}
                  </div>
                  <h4 className="font-semibold text-[15px] text-ink mb-1 group-hover:text-accent transition-colors">
                    {video.title}
                  </h4>
                  <p className="text-[13px] text-muted">{video.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Модальное окно */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          onClick={() => setModalOpen(false)}
        >
          <div className="hud glass-strong rounded-2xl p-2 max-w-[92vw] max-h-[88vh] relative" onClick={(e) => e.stopPropagation()}>
            <img src={currentImage} alt="" className="max-h-[82vh] max-w-[88vw] object-contain rounded-xl" />
            <button
              onClick={() => setModalOpen(false)}
              aria-label="Закрыть"
              className="absolute -top-3 -right-3 w-10 h-10 rounded-full btn-neon !p-0 flex items-center justify-center text-base"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
