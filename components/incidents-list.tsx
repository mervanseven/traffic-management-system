"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  AlertTriangle,
  Car,
  Construction,
  MapPin,
  Clock,
  RefreshCw,
  CloudSnow,
  Wind,
  Wifi,
  WifiOff,
} from "lucide-react"

interface Incident {
  id: string
  type: string
  severity: "low" | "medium" | "high"
  description: string
  location: string
  time: string
  category: string
  coordinates: [number, number]
  iconCategory: number
}

const IncidentsList = () => {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<"online" | "offline">("online")

  // Mock incidents for fallback
  const mockIncidents: Incident[] = [
    {
      id: "mock-1",
      type: "traffic",
      severity: "medium",
      description: "Alsancak Kordon'da yoğun trafik",
      location: "Konak",
      time: "5 dakika önce",
      category: "Tıkanıklık",
      coordinates: [27.13, 38.43],
      iconCategory: 6,
    },
    {
      id: "mock-2",
      type: "construction",
      severity: "low",
      description: "Bornova Kavşağı'nda yol çalışması",
      location: "Bornova",
      time: "15 dakika önce",
      category: "Yol Çalışması",
      coordinates: [27.22, 38.47],
      iconCategory: 7,
    },
    {
      id: "mock-3",
      type: "accident",
      severity: "high",
      description: "Karşıyaka'da trafik kazası",
      location: "Karşıyaka",
      time: "30 dakika önce",
      category: "Kaza",
      coordinates: [27.1, 38.46],
      iconCategory: 1,
    },
  ]

  useEffect(() => {
    // Hemen mock verileri göster, sonra API'yi dene
    setIncidents(mockIncidents)

    // Güvenli şekilde fetch işlemini başlat
    const fetchData = async () => {
      try {
        await fetchIncidentsSafely()
      } catch (error) {
        console.warn("Initial fetch failed, using mock data:", error)
        // Zaten mock veriler gösteriliyor, bir şey yapmaya gerek yok
      }
    }

    fetchData().catch((error) => {
      console.warn("Unhandled error in fetchData:", error)
    })

    // Auto-refresh her 2 dakikada bir
    const interval = setInterval(() => {
      fetchIncidentsSafely().catch((error) => {
        console.warn("Auto-refresh fetch failed:", error)
      })
    }, 120000)

    return () => clearInterval(interval)
  }, [])

  const fetchIncidentsSafely = async () => {
    console.log("📊 Olaylar güvenli şekilde yükleniyor...")
    setIsLoading(true)

    try {
      const bbox = "26.9,38.3,27.4,38.6"

      // Fetch işlemini güvenli şekilde yap
      let response
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 saniye timeout

        response = await fetch(`/api/traffic/incidents?bbox=${bbox}&language=tr-TR`, {
          signal: controller.signal,
          headers: { "Content-Type": "application/json" },
        })

        clearTimeout(timeoutId)
      } catch (fetchError) {
        console.warn("Fetch operation failed:", fetchError)
        throw new Error("Fetch failed")
      }

      if (!response || !response.ok) {
        throw new Error(`API Error: ${response?.status || "Unknown"}`)
      }

      let data
      try {
        data = await response.json()
      } catch (jsonError) {
        console.warn("JSON parsing failed:", jsonError)
        throw new Error("JSON parsing failed")
      }

      if (data && data.incidents && data.incidents.length > 0) {
        const processedIncidents = data.incidents
          .map((incident: any) => {
            try {
              const iconCategory = incident.properties?.iconCategory || 0
              const magnitudeOfDelay = incident.properties?.magnitudeOfDelay || 0

              return {
                id: incident.properties?.id || Math.random().toString(),
                type: getIncidentType(iconCategory),
                severity: getSeverityFromMagnitude(magnitudeOfDelay),
                description: incident.properties?.events?.[0]?.description || "Trafik olayı",
                location: getLocationFromCoordinates(incident.geometry?.coordinates?.[0]),
                time: getTimeFromIncident(incident.properties?.startTime),
                category: getCategoryName(iconCategory),
                coordinates: incident.geometry?.coordinates?.[0] || [27.14, 38.42],
                iconCategory: iconCategory,
              }
            } catch (processingError) {
              console.warn("Error processing incident:", processingError)
              return null
            }
          })
          .filter(Boolean) // null değerleri filtrele

        setIncidents(processedIncidents)
        setConnectionStatus("online")
        console.log(`✅ ${processedIncidents.length} gerçek olay yüklendi`)
      } else {
        console.log("ℹ️ API'den olay bulunamadı, mock veriler kullanılıyor")
        setIncidents(mockIncidents)
        setConnectionStatus("offline")
      }
    } catch (error) {
      console.warn("⚠️ Olaylar yüklenemedi, mock veriler kullanılıyor:", error)
      setIncidents(mockIncidents)
      setConnectionStatus("offline")
    } finally {
      setIsLoading(false)
    }
  }

  const getIncidentType = (iconCategory: number): string => {
    switch (iconCategory) {
      case 1:
        return "accident"
      case 7:
      case 8:
        return "construction"
      case 6:
        return "congestion"
      case 2:
      case 4:
      case 5:
      case 10:
      case 11:
        return "weather"
      default:
        return "other"
    }
  }

  const getSeverityFromMagnitude = (magnitude: number): "low" | "medium" | "high" => {
    if (magnitude >= 3) return "high"
    if (magnitude >= 2) return "medium"
    return "low"
  }

  const getLocationFromCoordinates = (coordinates: [number, number]): string => {
    if (!coordinates) return "İzmir"

    const [lon, lat] = coordinates

    // İzmir'in farklı bölgelerini koordinatlara göre tahmin et
    if (lon > 27.2) return "Bornova"
    if (lon < 27.0) return "Karşıyaka"
    if (lat > 38.45) return "Bayraklı"
    if (lat < 38.35) return "Gaziemir"
    return "Konak"
  }

  const getTimeFromIncident = (startTime: string): string => {
    if (!startTime) return "Bilinmiyor"

    try {
      const incidentTime = new Date(startTime)
      const now = new Date()
      const diffMinutes = Math.floor((now.getTime() - incidentTime.getTime()) / (1000 * 60))

      if (diffMinutes < 1) return "Az önce"
      if (diffMinutes < 60) return `${diffMinutes} dakika önce`

      const diffHours = Math.floor(diffMinutes / 60)
      if (diffHours < 24) return `${diffHours} saat önce`

      const diffDays = Math.floor(diffHours / 24)
      return `${diffDays} gün önce`
    } catch {
      return "Bilinmiyor"
    }
  }

  const getCategoryName = (category: number): string => {
    const categories: { [key: number]: string } = {
      0: "Bilinmeyen",
      1: "Kaza",
      2: "Sis",
      3: "Tehlikeli Koşullar",
      4: "Yağmur",
      5: "Buz",
      6: "Tıkanıklık",
      7: "Yol Çalışması",
      8: "Yol Kapanışı",
      9: "Yol Tehlikesi",
      10: "Kar",
      11: "Rüzgar",
      14: "Etkinlik",
    }
    return categories[category] || "Diğer"
  }

  const getIncidentIcon = (type: string, iconCategory: number) => {
    switch (type) {
      case "accident":
        return <Car className="h-4 w-4" />
      case "construction":
        return <Construction className="h-4 w-4" />
      case "weather":
        if (iconCategory === 10) return <CloudSnow className="h-4 w-4" />
        if (iconCategory === 11) return <Wind className="h-4 w-4" />
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200"
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "low":
        return "bg-green-100 text-green-800 border-green-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const getSeverityText = (severity: string) => {
    switch (severity) {
      case "high":
        return "Yüksek"
      case "medium":
        return "Orta"
      case "low":
        return "Düşük"
      default:
        return "Bilinmiyor"
    }
  }

  // Güvenli refresh fonksiyonu
  const handleRefresh = () => {
    fetchIncidentsSafely().catch((error) => {
      console.warn("Manual refresh failed:", error)
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {connectionStatus === "online" ? "Gerçek Zamanlı Olaylar" : "Örnek Olaylar"}
          </span>
          {connectionStatus === "online" ? (
            <Wifi className="h-4 w-4 text-green-600" />
          ) : (
            <WifiOff className="h-4 w-4 text-gray-600" />
          )}
        </div>
        <Button size="sm" variant="ghost" onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <ScrollArea className="h-[300px]">
        <div className="space-y-3">
          {isLoading ? (
            // Loading skeleton
            [1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-200 rounded-lg"></div>
              </div>
            ))
          ) : incidents.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Şu anda aktif olay bulunmuyor</p>
              <p className="text-xs mt-1">
                {connectionStatus === "online" ? "TomTom API'den gerçek zamanlı veri" : "Offline mod aktif"}
              </p>
            </div>
          ) : (
            incidents.map((incident) => (
              <div key={incident.id} className="p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getIncidentIcon(incident.type, incident.iconCategory)}
                    <span className="font-medium text-sm">{incident.category}</span>
                  </div>
                  <Badge className={getSeverityColor(incident.severity)}>{getSeverityText(incident.severity)}</Badge>
                </div>

                <p className="text-sm text-gray-700 mb-2">{incident.description}</p>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{incident.location}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{incident.time}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      {incidents.length > 0 && (
        <div className="text-xs text-gray-500 text-center pt-2 border-t">
          {connectionStatus === "online"
            ? `TomTom Traffic API • Son güncelleme: ${new Date().toLocaleTimeString("tr-TR")}`
            : "Offline Mod • Örnek veriler gösteriliyor"}
        </div>
      )}
    </div>
  )
}

export default IncidentsList
