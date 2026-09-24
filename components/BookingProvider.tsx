'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import BookingModal from '@/components/BookingModal';
import { DEFAULT_RATE_ID, DEFAULT_ROOM_TYPE_ID } from '@/lib/booking';

export type BookingOpenOptions = {
  /** Тариф по умолчанию — обычно берётся из карточки, где кликнули */
  rateId?: string;
  /** Категория номера по умолчанию */
  roomTypeId?: string;
  /** Откуда открыли форму: hero | header | prices | contacts */
  source?: string;
};

type BookingContextValue = {
  openBooking: (options?: BookingOpenOptions) => void;
  closeBooking: () => void;
  isOpen: boolean;
};

const BookingContext = createContext<BookingContextValue | null>(null);

/**
 * Один экземпляр модалки на всё приложение.
 *
 * Кнопки «Забронировать» в шапке, hero и ценах вызывают openBooking() и
 * передают тариф/источник — форма живёт в одном месте, а из карточки цен
 * гость попадает в модалку уже с нужной ценой суток.
 *
 * Работает и внутри порталов (мобильный drawer в Header): React сохраняет
 * контекст через createPortal.
 */
export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [rateId, setRateId] = useState(DEFAULT_RATE_ID);
  const [roomTypeId, setRoomTypeId] = useState(DEFAULT_ROOM_TYPE_ID);
  const [source, setSource] = useState('site');

  const openBooking = useCallback((options?: BookingOpenOptions) => {
    if (options?.rateId) setRateId(options.rateId);
    if (options?.roomTypeId) setRoomTypeId(options.roomTypeId);
    setSource(options?.source ?? 'site');
    setIsOpen(true);
  }, []);

  const closeBooking = useCallback(() => setIsOpen(false), []);

  const value = useMemo(
    () => ({ openBooking, closeBooking, isOpen }),
    [openBooking, closeBooking, isOpen],
  );

  return (
    <BookingContext.Provider value={value}>
      {children}
      <BookingModal
        open={isOpen}
        onClose={closeBooking}
        initialRateId={rateId}
        initialRoomTypeId={roomTypeId}
        source={source}
      />
    </BookingContext.Provider>
  );
}

export function useBooking(): BookingContextValue {
  const ctx = useContext(BookingContext);
  if (!ctx) {
    throw new Error('useBooking должен вызываться внутри <BookingProvider>');
  }
  return ctx;
}