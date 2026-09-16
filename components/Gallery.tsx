'use client';

import { Card, Modal } from 'antd';
import { CameraOutlined, VideoCameraOutlined, EnvironmentOutlined, MedicineBoxOutlined, CoffeeOutlined } from '@ant-design/icons';
import { useState } from 'react';

const photos = [
  {
    src: '/images/gallery/DJI_0595.png',
    title: 'Озеро Чедер',
    category: 'Природа',
    icon: <EnvironmentOutlined className="text-3xl text-white/80" />,
  },
  {
    src: '/images/gallery/DJI_0564.png',
    title: 'A-frame домики',
    category: 'Природа',
    icon: <EnvironmentOutlined className="text-3xl text-white/80" />,
  },
  {
    src: '/images/gallery/DJI_0585.png',
    title: 'Территория санатория',
    category: 'Природа',
    icon: <EnvironmentOutlined className="text-3xl text-white/80" />,
  },
  {
    src: '/images/gallery/IMG_1803.jpeg',
    title: 'Вид на комплекс',
    category: 'Природа',
    icon: <EnvironmentOutlined className="text-3xl text-white/80" />,
  },
  {
    src: '/images/gallery/DJI_0287.jpg',
    title: 'Главный корпус',
    category: 'Природа',
    icon: <EnvironmentOutlined className="text-3xl text-white/80" />,
  },
  {
    src: '/images/gallery/DJI_0313.jpg',
    title: 'Корпус с озера',
    category: 'Природа',
    icon: <EnvironmentOutlined className="text-3xl text-white/80" />,
  },
  {
    src: '/images/rooms/room-1.png',
    title: 'Двухместный номер',
    category: 'Номера',
    icon: <CameraOutlined className="text-3xl text-white/80" />,
  },
  {
    src: '/images/rooms/room-2.png',
    title: 'Односпальный номер',
    category: 'Номера',
    icon: <CameraOutlined className="text-3xl text-white/80" />,
  },
  {
    src: '/images/rooms/room-3.png',
    title: 'Номер с двумя кроватями',
    category: 'Номера',
    icon: <CameraOutlined className="text-3xl text-white/80" />,
  },
  {
    src: '/images/gallery/IMG_1917.jpeg',
    title: 'Гидромассажная ванна',
    category: 'Медицина',
    icon: <MedicineBoxOutlined className="text-3xl text-white/80" />,
  },
  {
    src: '/images/gallery/2dccb391-652d-42e9-91d3-d5d630dde6da.jpg',
    title: 'Столовая',
    category: 'Медицина',
    icon: <CoffeeOutlined className="text-3xl text-white/80" />,
  },
  {
    src: '/images/gallery/DJI_0295.jpg',
    title: 'Вид на комплекс',
    category: 'Природа',
    icon: <EnvironmentOutlined className="text-3xl text-white/80" />,
  },
];

const videos = [
  {
    title: 'Рекламный ролик «Здравница Чедер»',
    date: 'Февраль 2026',
    desc: 'Санаторий «Чедер»: заботимся о вашем здоровье!',
    gradient: 'from-[#1b4332] to-[#2d6a4f]',
    emoji: '▶️',
  },
  {
    title: 'Обзор столовой',
    date: 'Январь 2026',
    desc: 'Трёхразовое питание включено в стоимость проживания',
    gradient: 'from-[#2d6a4f] to-[#40916c]',
    emoji: '🍽️',
  },
  {
    title: 'Физиотерапия',
    date: 'Январь 2026',
    desc: 'Незаменима в период реабилитации и восстановления',
    gradient: 'from-[#40916c] to-[#52b788]',
    emoji: '💆',
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
    <section id="gallery" className="py-14 sm:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section header */}
        <div className="text-center mb-9 fade-section">
          <span className="inline-block text-primary font-semibold text-sm tracking-wider uppercase mb-3">Галерея</span>
          <h2 className="text-2xl sm:text-3xl font-bold text-primary-dark mb-3">
            Жизнь курорта <span className="text-primary">«Чедер»</span>
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Фотографии и видео из жизни здравницы. Озёра, горы, лечебные процедуры и праздники — всё это Чедер.
          </p>
        </div>

        {/* Photo Gallery */}
        <div className="fade-section">
          {/* Filters */}
          <div className="flex flex-wrap justify-center gap-2 mb-7">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`px-4 py-2 rounded-full text-[13px] font-medium transition-all duration-300 ${
                  activeFilter === cat
                    ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-105'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-200'
                }`}
              >
                {cat}
                {activeFilter === cat && (
                  <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                )}
              </button>
            ))}
          </div>

          {/* Photos grid — uniform sized cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-2.5 mb-12">
            {filteredPhotos.map((photo, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-xl shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer aspect-square"
                onClick={() => openImage(photo.src)}
              >
                <img
                  src={photo.src}
                  alt={photo.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <div className="flex items-center gap-1.5 text-white/70 text-[10px] mb-1">
                      {photo.icon}
                      <span>{photo.category}</span>
                    </div>
                    <h3 className="text-white font-bold text-xs leading-tight">{photo.title}</h3>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Videos section */}
        <div className="fade-section">
          <div className="flex items-center gap-2.5 mb-6">
            <VideoCameraOutlined className="text-xl text-primary" />
            <h3 className="text-xl font-bold text-primary-dark">Видео</h3>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {videos.map((video, index) => (
              <Card
                key={index}
                className="border-0 shadow-md overflow-hidden hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group cursor-pointer"
                styles={{ body: { padding: 0 } }}
              >
                <div className={`relative overflow-hidden aspect-video bg-gradient-to-br ${video.gradient} flex items-center justify-center group-hover:opacity-90 transition-opacity`}>
                  <span className="text-5xl opacity-60 group-hover:scale-110 transition-transform duration-300">{video.emoji}</span>
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                      <VideoCameraOutlined className="text-xl text-primary" />
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 text-[11px] text-gray-500 mb-1.5">
                    <CameraOutlined /> {video.date}
                  </div>
                  <h4 className="font-bold text-[15px] text-gray-900 mb-1 group-hover:text-primary transition-colors">{video.title}</h4>
                  <p className="text-[13px] text-gray-600">{video.desc}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Image modal */}
      <Modal
        open={modalOpen}
        footer={null}
        closable
        width="90vw"
        styles={{ body: { padding: 0, textAlign: 'center' } }}
        onCancel={() => setModalOpen(false)}
      >
        <img src={currentImage} alt="" className="max-h-[85vh] w-full object-contain" />
      </Modal>
    </section>
  );
}
