// app/_components/ClientSideComponents.tsx
'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const TomTomTrafficMap = dynamic(() => import('@/components/tomtom-traffic-map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[500px] flex items-center justify-center bg-gray-100 rounded-lg">
      <div className="text-center">
        <Skeleton className="h-8 w-8 rounded-full mx-auto mb-4" />
        <Skeleton className="h-4 w-32 mx-auto mb-2" />
        <Skeleton className="h-3 w-24 mx-auto" />
      </div>
    </div>
  ),
});

const TrafficMap = dynamic(() => import('@/components/traffic-map'), {
  ssr: false,
  loading: () => <div>Yükleniyor...</div>,
});

const RealtimeStats = dynamic(() => import('@/components/realtime-stats'), {
  ssr: false,
  loading: () => <div>Yükleniyor...</div>,
});

const IncidentsList = dynamic(() => import('@/components/incidents-list'), {
  ssr: false,
  loading: () => <div>Yükleniyor...</div>,
});

export default function ClientSideComponents() {
  return (
    <div className="space-y-6">
      <TomTomTrafficMap />
      <TrafficMap />
      <RealtimeStats />
      <IncidentsList />
    </div>
  );
}
