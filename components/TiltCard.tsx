'use client';

import { useRef, useCallback, type ReactNode, type CSSProperties } from 'react';

type TiltCardProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Максимальный угол наклона в градусах */
  maxTilt?: number;
  /** Блик, следующий за курсором */
  glare?: boolean;
  /** Неоновая скан-линия сверху */
  scan?: boolean;
};

/**
 * 3D-карточка: наклоняется за курсором (rotateX/rotateY),
 * блик и скан-линия следуют за мышью, при уходе — плавный возврат.
 */
export default function TiltCard({
  children,
  className = '',
  style,
  maxTilt = 10,
  glare = true,
  scan = false,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = useCallback(
    (e: React.MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      const rx = (0.5 - py) * maxTilt;
      const ry = (px - 0.5) * maxTilt;
      el.classList.remove('tilt-idle');
      el.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateZ(10px)`;
      el.style.setProperty('--glare-x', `${(px * 100).toFixed(1)}%`);
      el.style.setProperty('--glare-y', `${(py * 100).toFixed(1)}%`);
    },
    [maxTilt],
  );

  const onLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.classList.add('tilt-idle');
    el.style.transform = '';
  }, []);

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`tilt-card ${className}`}
      style={style}
    >
      {children}
      {glare && <div className="tilt-glare" />}
      {scan && <div className="scan-line" />}
    </div>
  );
}
