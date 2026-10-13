import { Suspense } from 'react';
import { Spin } from 'antd';
import RecentBookings from '@/components/admin/RecentBookings';
import LeadsBoard from '@/components/admin/LeadsBoard';

export default function AdminPage() {
  return (
    <>
      <Suspense fallback={<div className="py-20 flex justify-center"><Spin size="large" /></div>}>
        <RecentBookings />
      </Suspense>
      <Suspense fallback={<div className="py-20 flex justify-center"><Spin size="large" /></div>}>
        <LeadsBoard />
      </Suspense>
    </>
  );
}
