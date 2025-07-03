"use client"

import { useEffect, useState } from "react"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Minus, WifiOff } from "lucide-react"

interface TrafficStats {
  averageSpeed: number
  congestionLevel: number
  activeIncidents: number
  optimizedRoutes: number
  timeSaved: number
  trend: "up" | "down" | "stable"
}

const RealtimeStats = () => {
  const [stats, setStats] = useState<TrafficStats>({
    averageSpeed: 45,
    congestionLevel: 35,
    activeIncidents: 3,
    optimizedRoutes: 127,
    timeSaved: 23,
    trend: "stable",
  })
  const [isLoading, setIsLoading] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<"online" | "offline">("online")

  useEffect(() => {
    // Hemen varsayılan verileri göster
    setIsLoading(false)

    // Güvenli şekilde veri üretme
    const generateStatsSafely = () => {
      try {
        // Gerçek API çağrısı burada olabilir
        // Şimdilik mock veri üretiyoruz
        const newStats = {
          averageSpeed: Math.floor(Math.random() * 20) + 35, // 35-55 km/h
          congestionLevel: Math.floor(Math.random() * 60) + 20, // 20-80%
          activeIncidents: Math.floor(Math.random() * 5) + 1, // 1-6 incidents
          optimizedRoutes: Math.floor(Math.random() * 50) + 100, // 100-150 routes
          timeSaved: Math.floor(Math.random() * 15) + 15, // 15-30 minutes
          trend: ["up", "down", "stable"][Math.floor(Math.random() * 3)] as "up" | "down" | "stable",
        }

        setStats(newStats)
        setConnectionStatus("online")
        setIsLoading(false)
      } catch (error) {
        console.warn("Stats generation error:", error)
        setConnectionStatus("offline")
        setIsLoading(false)
      }
    }

    // İlk yükleme
    generateStatsSafely()

    // 30 saniyede bir güncelle
    const interval = setInterval(() => {
      generateStatsSafely()
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const getTrendIcon = () => {
    switch (stats.trend) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getCongestionBadgeColor = () => {
    if (stats.congestionLevel < 30) return "bg-green-100 text-green-800"
    if (stats.congestionLevel < 60) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-2 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {connectionStatus === "offline" && (
        <div className="flex items-center gap-2 mb-3 p-2 bg-gray-100 rounded-md">
          <WifiOff className="h-4 w-4 text-gray-600" />
          <span className="text-xs text-gray-600">Offline mod - Örnek veriler</span>
        </div>
      )}

      {/* Average Speed */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Ortalama Hız</span>
          <div className="flex items-center gap-1">
            <span className="text-lg font-bold">{stats.averageSpeed} km/h</span>
            {getTrendIcon()}
          </div>
        </div>
        <Progress value={(stats.averageSpeed / 60) * 100} className="h-2" />
      </div>

      {/* Congestion Level */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Tıkanıklık Seviyesi</span>
          <Badge className={getCongestionBadgeColor()}>%{stats.congestionLevel}</Badge>
        </div>
        <Progress value={stats.congestionLevel} className="h-2" />
      </div>

      {/* Active Incidents */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Aktif Olaylar</span>
        <Badge variant={stats.activeIncidents > 5 ? "destructive" : "secondary"}>{stats.activeIncidents}</Badge>
      </div>

      {/* Optimized Routes Today */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Optimize Edilen Rotalar</span>
        <span className="text-lg font-bold text-blue-600">{stats.optimizedRoutes}</span>
      </div>

      {/* Time Saved */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Toplam Zaman Tasarrufu</span>
        <span className="text-lg font-bold text-green-600">{stats.timeSaved} dk</span>
      </div>

      {/* Last Update */}
      <div className="text-xs text-gray-500 text-center pt-2 border-t">
        Son güncelleme: {new Date().toLocaleTimeString("tr-TR")}
      </div>
    </div>
  )
}

export default RealtimeStats
