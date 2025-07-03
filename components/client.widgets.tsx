'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, AlertTriangle, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const TomTomTrafficMap = dynamic(() => import("@/components/tomtom-traffic-map"), {
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

const RealtimeStats = dynamic(() => import("@/components/realtime-stats"), {
  ssr: false,
  loading: () => (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i}>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-2 w-4/5" />
        </div>
      ))}
    </div>
  ),
});

const IncidentsList = dynamic(() => import("@/components/incidents-list"), {
  ssr: false,
  loading: () => (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-16 w-full rounded-lg" />
      ))}
    </div>
  ),
});

export default function ClientWidgets() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      <div className="lg:col-span-2">
        <Card className="h-[600px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              TomTom Gerçek Zamanlı Trafik Haritası
              <Badge variant="default" className="bg-blue-600">TomTom API</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <TomTomTrafficMap />
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Anlık İstatistikler
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RealtimeStats />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Aktif Olaylar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <IncidentsList />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
