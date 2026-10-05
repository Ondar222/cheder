import { Suspense } from 'react';
import { Spin } from 'antd';
import CreateBookingForm from '@/components/admin/CreateBookingForm';

/**
 * useSearchParams на статической странице требует Suspense: без границы
 * сборка Next ругается, что запрос к параметрам нельзя выполнить на сервере.
 */
export default function AdminNewBookingPage() {
  return (
    <Suspense
      fallback={
        <div className="py-20 flex justify-center">
          <Spin size="large" />
        </div>
      }
    >
      <CreateBookingForm />
    </Suspense>
  );
}
