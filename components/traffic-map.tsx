"use client"

import { useEffect, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, AlertTriangle, WifiOff, MapPin } from "lucide-react"

interface TrafficIncident {
  id: string
  type: string
  severity: number
  description: string
  coordinates: [number, number]
  category: string
}

declare global {
  interface Window {
    L: any
  }
}

const TrafficMap = () => {
  const mapElement = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [incidents, setIncidents] = useState<TrafficIncident[]>([])
  const [trafficLevel, setTrafficLevel] = useState<"low" | "medium" | "high">("medium")
  const [mapLoaded, setMapLoaded] = useState(false)
  const [sdkLoaded, setSdkLoaded] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"online" | "offline">("online")

  const IZMIR_CENTER = [38.42, 27.14] // Leaflet için lat, lng sırası

  // Mock data for fallback
  const mockIncidents: TrafficIncident[] = [
    {
      id: "mock-1",
      type: "1",
      severity: 2,
      description: "Alsancak Kordon'da yoğun trafik",
      coordinates: [38.43, 27.13],
      category: "Tıkanıklık",
    },
    {
      id: "mock-2",
      type: "7",
      severity: 1,
      description: "Bornova Kavşağı'nda yol çalışması",
      coordinates: [38.47, 27.22],
      category: "Yol Çalışması",
    },
    {
      id: "mock-3",
      type: "1",
      severity: 3,
      description: "Karşıyaka'da trafik kazası",
      coordinates: [38.46, 27.1],
      category: "Kaza",
    },
  ]

  useEffect(() => {
    console.log("🗺️ Leaflet TrafficMap başlatılıyor...")

    // Hemen mock verileri göster
    setIncidents(mockIncidents)
    setTrafficLevel("medium")

    initializeMapSafely()

    return () => {
      cleanupMap()
    }
  }, [])

  const initializeMapSafely = async () => {
    try {
      setIsLoading(true)
      setConnectionStatus("online")

      // Leaflet SDK'yı güvenli şekilde yükle
      await loadLeafletSDKSafely()
      setSdkLoaded(true)

      // Haritayı güvenli şekilde oluştur
      await createMapSafely()
      setMapLoaded(true)

      // Verileri güvenli şekilde yükle
      await loadDataSafely()

      setIsLoading(false)
      console.log("✅ Leaflet haritası başarıyla yüklendi")
    } catch (error) {
      console.warn("⚠️ Harita yüklenirken sorun oluştu, fallback moda geçiliyor:", error)
      handleMapError()
    }
  }

  const loadLeafletSDKSafely = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        // Zaten yüklüyse direkt devam et
        if (window.L) {
          console.log("✅ Leaflet SDK zaten yüklü")
          resolve()
          return
        }

        console.log("📦 Leaflet SDK yükleniyor...")

        // CSS yükle
        const link = document.createElement("link")
        link.rel = "stylesheet"
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        link.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
        link.crossOrigin = ""
        link.onload = () => console.log("✅ Leaflet CSS yüklendi")
        link.onerror = () => console.warn("⚠️ Leaflet CSS yüklenemedi")
        document.head.appendChild(link)

        // JavaScript yükle
        const script = document.createElement("script")
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
        script.crossOrigin = ""

        script.onload = () => {
          setTimeout(() => {
            if (window.L) {
              console.log("✅ Leaflet SDK başarıyla yüklendi")
              resolve()
            } else {
              console.warn("⚠️ Leaflet SDK yüklendi ama erişilemez")
              reject(new Error("Leaflet SDK not available after loading"))
            }
          }, 500)
        }

        script.onerror = () => {
          console.warn("⚠️ Leaflet SDK yüklenemedi")
          reject(new Error("Failed to load Leaflet SDK"))
        }

        document.head.appendChild(script)

        // 10 saniye timeout
        setTimeout(() => {
          if (!window.L) {
            console.warn("⏰ Leaflet SDK yükleme timeout")
            reject(new Error("Leaflet SDK loading timeout"))
          }
        }, 10000)
      } catch (error) {
        console.warn("⚠️ SDK yükleme hatası:", error)
        reject(error)
      }
    })
  }

  const createMapSafely = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        if (!window.L || !mapElement.current) {
          console.warn("⚠️ Leaflet SDK veya map elementi bulunamadı")
          reject(new Error("Leaflet SDK or map element not found"))
          return
        }

        console.log("🗺️ Leaflet haritası oluşturuluyor...")

        // Haritayı oluştur
        mapRef.current = window.L.map(mapElement.current, {
          center: IZMIR_CENTER,
          zoom: 12,
          zoomControl: true,
          attributionControl: true,
        })

        // OpenStreetMap tile layer ekle
        window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(mapRef.current)

        // Trafik simülasyonu için renkli yollar ekle
        addTrafficSimulationSafely()

        console.log("✅ Leaflet haritası yüklendi")
        resolve()
      } catch (error) {
        console.warn("⚠️ Harita oluşturma hatası:", error)
        reject(error)
      }
    })
  }

  const addTrafficSimulationSafely = () => {
    try {
      if (!mapRef.current || !window.L) return

      console.log("🚦 Trafik simülasyonu ekleniyor...")

      // İzmir'deki ana yolları simüle et
      const trafficRoutes = [
        {
          name: "Alsancak - Kordon",
          coordinates: [
            [38.43, 27.13],
            [38.42, 27.14],
            [38.41, 27.15],
          ],
          color: "#f59e0b", // Orta trafik
          weight: 6,
        },
        {
          name: "Bornova Yolu",
          coordinates: [
            [38.42, 27.14],
            [38.45, 27.2],
            [38.47, 27.22],
          ],
          color: "#ef4444", // Yoğun trafik
          weight: 8,
        },
        {
          name: "Karşıyaka Bağlantısı",
          coordinates: [
            [38.42, 27.14],
            [38.44, 27.1],
            [38.46, 27.08],
          ],
          color: "#10b981", // Akıcı trafik
          weight: 4,
        },
        {
          name: "Gaziemir Yönü",
          coordinates: [
            [38.42, 27.14],
            [38.38, 27.16],
            [38.35, 27.18],
          ],
          color: "#f59e0b", // Orta trafik
          weight: 6,
        },
      ]

      trafficRoutes.forEach((route) => {
        const polyline = window.L.polyline(route.coordinates, {
          color: route.color,
          weight: route.weight,
          opacity: 0.8,
        }).addTo(mapRef.current)

        polyline.bindPopup(`
          <div style="padding: 8px;">
            <h4 style="margin: 0 0 8px 0; font-weight: bold;">${route.name}</h4>
            <p style="margin: 0; font-size: 12px;">
              Trafik Durumu: ${route.color === "#10b981" ? "Akıcı" : route.color === "#f59e0b" ? "Orta" : "Yoğun"}
            </p>
          </div>
        `)
      })

      console.log("✅ Trafik simülasyonu eklendi")
    } catch (error) {
      console.warn("⚠️ Trafik simülasyonu eklenemedi:", error)
    }
  }

  const loadDataSafely = async () => {
    console.log("📊 Veriler yükleniyor...")

    try {
      // Simüle edilmiş trafik verilerini yükle
      await loadTrafficDataSafely()

      // Olayları güvenli şekilde yükle
      await loadIncidentsSafely()

      // Auto-refresh kurulumu
      const interval = setInterval(() => {
        loadTrafficDataSafely().catch((error) => {
          console.warn("Traffic data refresh error:", error)
        })

        loadIncidentsSafely().catch((error) => {
          console.warn("Incidents refresh error:", error)
        })
      }, 120000)

      if (mapRef.current) {
        mapRef.current._refreshInterval = interval
      }
    } catch (error) {
      console.warn("⚠️ Veri yükleme hatası:", error)
    }
  }

  const loadTrafficDataSafely = async () => {
    try {
      // Simüle edilmiş trafik verisi
      const simulatedSpeed = Math.floor(Math.random() * 30) + 30 // 30-60 km/h
      const freeFlowSpeed = 60
      const ratio = simulatedSpeed / freeFlowSpeed

      if (ratio > 0.8) setTrafficLevel("low")
      else if (ratio > 0.5) setTrafficLevel("medium")
      else setTrafficLevel("high")

      setConnectionStatus("online")
      console.log(`✅ Simüle edilmiş trafik verisi: ${simulatedSpeed} km/h`)
    } catch (error) {
      console.warn("⚠️ Trafik verisi simülasyonu hatası:", error)
      setTrafficLevel("medium")
      setConnectionStatus("offline")
    }
  }

  const loadIncidentsSafely = async () => {
    try {
      // Rastgele olaylar üret
      const randomIncidents = mockIncidents.map((incident, index) => ({
        ...incident,
        id: `incident-${Date.now()}-${index}`,
        severity: Math.floor(Math.random() * 3) + 1,
        description: [
          "Alsancak Kordon'da yoğun trafik",
          "Bornova Kavşağı'nda yol çalışması",
          "Karşıyaka'da trafik kazası",
          "Konak Meydanı'nda etkinlik",
          "Mavişehir'de araç arızası",
        ][Math.floor(Math.random() * 5)],
      }))

      setIncidents(randomIncidents)
      addIncidentMarkersSafely(randomIncidents)
      setConnectionStatus("online")
      console.log(`✅ ${randomIncidents.length} simüle edilmiş olay yüklendi`)
    } catch (error) {
      console.warn("⚠️ Olaylar simülasyonu hatası:", error)
      setIncidents(mockIncidents)
      addIncidentMarkersSafely(mockIncidents)
      setConnectionStatus("offline")
    }
  }

  const addIncidentMarkersSafely = (incidentList: TrafficIncident[]) => {
    try {
      if (!mapRef.current || !window.L || !mapLoaded) return

      // Mevcut markerları temizle
      if (mapRef.current._incidentMarkers) {
        mapRef.current._incidentMarkers.forEach((marker: any) => {
          try {
            mapRef.current.removeLayer(marker)
          } catch (e) {
            console.warn("Marker temizleme hatası:", e)
          }
        })
      }
      mapRef.current._incidentMarkers = []

      incidentList.forEach((incident) => {
        try {
          // Özel ikon oluştur
          const iconColor = getSeverityColor(incident.severity)
          const customIcon = window.L.divIcon({
            className: "custom-incident-marker",
            html: `
              <div style="
                background-color: ${iconColor};
                width: 20px;
                height: 20px;
                border-radius: 50%;
                border: 2px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: bold;
                font-size: 10px;
              ">!</div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          })

          const marker = window.L.marker(incident.coordinates, {
            icon: customIcon,
          }).addTo(mapRef.current)

          marker.bindPopup(`
            <div style="padding: 12px; min-width: 200px;">
              <h3 style="font-weight: bold; margin-bottom: 8px; color: #1f2937; font-size: 14px;">${incident.category}</h3>
              <p style="font-size: 12px; margin: 0; color: #4b5563; line-height: 1.4;">${incident.description}</p>
              <div style="margin-top: 8px; font-size: 11px; color: #6b7280;">
                Şiddet: ${getSeverityText(incident.severity)}
              </div>
            </div>
          `)

          mapRef.current._incidentMarkers.push(marker)
        } catch (markerError) {
          console.warn("Marker ekleme hatası:", markerError)
        }
      })

      console.log(`✅ ${incidentList.length} marker eklendi`)
    } catch (error) {
      console.warn("⚠️ Marker ekleme genel hatası:", error)
    }
  }

  const handleMapError = () => {
    console.log("🔄 Hata yönetimi devreye girdi")
    setIsLoading(false)
    setMapLoaded(true)
    setIncidents(mockIncidents)
    setTrafficLevel("medium")
    setConnectionStatus("offline")
  }

  const cleanupMap = () => {
    try {
      if (mapRef.current) {
        if (mapRef.current._refreshInterval) {
          clearInterval(mapRef.current._refreshInterval)
        }
        mapRef.current.remove()
      }
    } catch (error) {
      console.warn("⚠️ Harita temizleme hatası:", error)
    }
  }

  const refreshDataSafely = async () => {
    console.log("🔄 Veriler yenileniyor...")
    setIsLoading(true)

    try {
      const refreshPromises = [
        loadTrafficDataSafely().catch((error) => {
          console.warn("Traffic refresh error:", error)
          return null
        }),
        loadIncidentsSafely().catch((error) => {
          console.warn("Incidents refresh error:", error)
          return null
        }),
      ]

      await Promise.allSettled(refreshPromises)
    } catch (error) {
      console.warn("⚠️ Veri yenileme hatası:", error)
    } finally {
      setTimeout(() => setIsLoading(false), 1000)
    }
  }

  const getSeverityColor = (severity: number): string => {
    if (severity <= 1) return "#10b981"
    if (severity <= 2) return "#f59e0b"
    if (severity <= 3) return "#f97316"
    return "#ef4444"
  }

  const getSeverityText = (severity: number): string => {
    if (severity <= 1) return "Düşük"
    if (severity <= 2) return "Orta"
    if (severity <= 3) return "Yüksek"
    return "Kritik"
  }

  const getTrafficLevelColor = () => {
    switch (trafficLevel) {
      case "low":
        return "bg-green-500"
      case "medium":
        return "bg-yellow-500"
      case "high":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  const getTrafficLevelText = () => {
    switch (trafficLevel) {
      case "low":
        return "Akıcı"
      case "medium":
        return "Orta"
      case "high":
        return "Yoğun"
      default:
        return "Bilinmiyor"
    }
  }

  const handleRefresh = () => {
    refreshDataSafely().catch((error) => {
      console.warn("Manual refresh failed:", error)
    })
  }

  return (
    <div className="relative h-[500px] w-full">
      {/* Map Container */}
      <div ref={mapElement} className="w-full h-full rounded-lg bg-gray-100" style={{ minHeight: "500px" }}>
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-blue-600" />
              <p className="text-lg font-medium mb-2">
                {!sdkLoaded ? "Leaflet SDK Yükleniyor" : !mapLoaded ? "Harita Başlatılıyor" : "Veriler Yükleniyor"}
              </p>
              <p className="text-sm">
                {!sdkLoaded
                  ? "OpenStreetMap kütüphanesi indiriliyor..."
                  : !mapLoaded
                    ? "İzmir haritası hazırlanıyor..."
                    : "Trafik verileri simüle ediliyor..."}
              </p>
            </div>
          </div>
        )}

        {/* Fallback Map Display */}
        {!isLoading && !mapLoaded && connectionStatus === "offline" && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-600">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <WifiOff className="w-8 h-8 text-blue-600" />
              </div>
              <p className="text-lg font-medium mb-2">Offline Mod</p>
              <p className="text-sm mb-4">Harita servisi erişilemez, örnek veriler gösteriliyor</p>
              <Button onClick={() => window.location.reload()} variant="outline">
                Tekrar Dene
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {isLoading && mapLoaded && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Veriler güncelleniyor...</span>
          </div>
        </div>
      )}

      {/* Controls Overlay */}
      {(mapLoaded || connectionStatus === "offline") && (
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <Button size="sm" variant="secondary" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>

          <Badge className={`${getTrafficLevelColor()} text-white`}>Trafik: {getTrafficLevelText()}</Badge>

          {incidents.length > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {incidents.length} Olay
            </Badge>
          )}

          <Badge variant="default" className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            OpenStreetMap
          </Badge>
        </div>
      )}

      {/* Legend */}
      {(mapLoaded || connectionStatus === "offline") && (
        <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg">
          <h4 className="font-semibold text-sm mb-2">Trafik Durumu</h4>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-1 bg-green-500 rounded"></div>
              <span>Akıcı (60+ km/h)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-1 bg-yellow-500 rounded"></div>
              <span>Orta (30-60 km/h)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-1 bg-orange-500 rounded"></div>
              <span>Yoğun (10-30 km/h)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-1 bg-red-500 rounded"></div>
              <span>Tıkanık (&lt;10 km/h)</span>
            </div>
          </div>
        </div>
      )}

      {/* Status Info */}
      {(mapLoaded || connectionStatus === "offline") && (
        <div className="absolute bottom-4 right-4 bg-white p-2 rounded-lg shadow-lg text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <span>OpenStreetMap • Ücretsiz • Simüle Edilmiş Veriler</span>
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
          </div>
          <div className="text-xs text-gray-500 mt-1">Son güncelleme: {new Date().toLocaleTimeString("tr-TR")}</div>
        </div>
      )}
    </div>
  )
}

export default TrafficMap
