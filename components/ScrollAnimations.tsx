'use client';

import { useEffect } from 'react';

/**
 * Скролл-reveal: секции появляются с 3D-эффектом (rotateX + подъём),
 * когда попадают в зону видимости. Поддерживает и старый класс
 * .fade-section (используется в горизонтальных каруселях, где
 * transform ломает snap-скролл — там только fade).
 */
export default function ScrollAnimations() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' },
    );

    const sections = document.querySelectorAll('.reveal, .fade-section');
    sections.forEach((s) => observer.observe(s));

    return () => observer.disconnect();
  }, []);

  return null;
}
