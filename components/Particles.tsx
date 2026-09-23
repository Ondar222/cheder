'use client';

import { useEffect, useRef } from 'react';

/**
 * Вечерние «светлячки» над озером: мягкие светящиеся точки,
 * часть — тёплого золотого света. Плавно дрейфуют, без техно-связей.
 */
export default function Particles({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    type Fly = {
      x: number; y: number;
      vx: number; vy: number;
      r: number;
      warm: boolean;
      phase: number;
      speed: number;
    };

    const count = Math.min(46, Math.max(20, Math.floor(window.innerWidth / 36)));
    const pts: Fly[] = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.16 - 0.05,
      r: Math.random() * 2.2 + 1.2,
      warm: Math.random() < 0.3,
      phase: Math.random() * Math.PI * 2,
      speed: 0.008 + Math.random() * 0.012,
    }));

    const tick = () => {
      ctx.clearRect(0, 0, w, h);

      for (const p of pts) {
        p.x += p.vx;
        p.y += p.vy;
        p.phase += p.speed;
        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        if (p.y > h + 20) p.y = -20;

        // Мягкое «дыхание» света
        const glow = 0.25 + Math.sin(p.phase) * 0.2;
        const radius = p.r * (1 + Math.sin(p.phase) * 0.2);

        const color = p.warm ? '232, 207, 158' : '124, 217, 190';
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius * 5);
        grad.addColorStop(0, `rgba(${color}, ${(glow + 0.3).toFixed(2)})`);
        grad.addColorStop(0.4, `rgba(${color}, ${glow.toFixed(2)})`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.beginPath();
        ctx.fillStyle = grad;
        ctx.arc(p.x, p.y, radius * 5, 0, Math.PI * 2);
        ctx.fill();

        // Ядро светлячка
        ctx.beginPath();
        ctx.fillStyle = p.warm
          ? `rgba(247, 234, 208, ${(glow + 0.35).toFixed(2)})`
          : `rgba(201, 242, 226, ${(glow + 0.35).toFixed(2)})`;
        ctx.arc(p.x, p.y, radius * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
