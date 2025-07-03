"use client"

import { useEffect, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RefreshCw, AlertTriangle, MapPin, Zap, WifiOff } from "lucide-react"

// TomTom SDK types
declare global {
  interface Window {
    tt: any
  }
}

const TomTomTrafficMap = () => {
  const mapElement = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"online" | "offline">("online")
  const [trafficLevel, setTrafficLevel] = useState<"low" | "medium" | "high">("medium")
  const [incidents, setIncidents] = useState<any[]>([])

  const TOMTOM_API_KEY = "vxNgHq8W1x8soPbMdhwWqgyDrT6ZVMXf"
  const IZMIR_CENTER = [27.14, 38.42] // [lng, lat] for TomTom

  useEffect(() => {
    console.log("🗺️ TomTom Traffic Map başlatılıyor...")
    initializeTomTomMap()

    return () => {
      cleanupMap()
    }
  }, [])

  const initializeTomTomMap = async () => {
    try {
      setIsLoading(true)
      setConnectionStatus("online")

      // TomTom SDK'yı yükle
      await loadTomTomSDK()

      // Haritayı oluştur
      await createTomTomMap()
      setMapLoaded(true)

      // Trafik verilerini yükle
      await loadTrafficVectorTiles()

      setIsLoading(false)
      console.log("✅ TomTom Traffic Map başarıyla yüklendi")
    } catch (error) {
      console.warn("⚠️ TomTom haritası yüklenirken sorun oluştu:", error)
      handleMapError()
    }
  }

  const loadTomTomSDK = async (): Promise<void> => {
    try {
      // Eğer zaten yüklüyse direkt devam et
      if (window.tt) {
        console.log("✅ TomTom SDK zaten yüklü")
        return
      }

      console.log("📦 TomTom SDK yükleniyor...")

      // CSS yükle
      await new Promise<void>((resolve, reject) => {
        const link = document.createElement("link")
        link.rel = "stylesheet"
        link.href = "https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.25.0/maps/maps.css"
        link.onload = () => {
          console.log("✅ TomTom CSS yüklendi")
          resolve()
        }
        link.onerror = () => reject(new Error("CSS yüklenemedi"))
        document.head.appendChild(link)
      })

      // JavaScript yükle
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script")
        script.src = "https://api.tomtom.com/maps-sdk-for-web/cdn/6.x/6.25.0/maps/maps-web.min.js"
        script.async = true

        script.onload = () => {
          setTimeout(() => {
            if (window.tt) {
              console.log("✅ TomTom SDK başarıyla yüklendi")
              resolve()
            } else {
              reject(new Error("TomTom SDK yüklendi ama erişilemez"))
            }
          }, 500)
        }

        script.onerror = () => reject(new Error("TomTom SDK yüklenemedi"))
        document.head.appendChild(script)
      })
    } catch (error) {
      console.error("TomTom SDK yükleme hatası:", error)
      throw error
    }
  }

  const createTomTomMap = async (): Promise<void> => {
    try {
      if (!window.tt || !mapElement.current) {
        throw new Error("TomTom SDK veya map elementi bulunamadı")
      }

      console.log("🗺️ TomTom haritası oluşturuluyor...")

      // TomTom haritasını oluştur (verdiğin kod yapısını kullanarak)
      mapRef.current = window.tt.map({
        key: TOMTOM_API_KEY,
        container: mapElement.current,
        center: IZMIR_CENTER, // İzmir koordinatları [lon, lat]
        zoom: 12,
      })

      // Harita yüklendiğinde
      return new Promise<void>((resolve, reject) => {
        mapRef.current.on("load", () => {
          console.log("✅ TomTom haritası yüklendi")
          addMapControls()
          resolve()
        })

        mapRef.current.on("error", (error: any) => {
          console.error("TomTom harita hatası:", error)
          reject(error)
        })

        // 15 saniye timeout
        setTimeout(() => {
          reject(new Error("Harita yükleme timeout"))
        }, 15000)
      })
    } catch (error) {
      console.error("TomTom haritası oluşturma hatası:", error)
      throw error
    }
  }

  const loadTrafficVectorTiles = async () => {
    try {
      if (!mapRef.current) return

      console.log("🚦 TomTom trafik vector tile'ları yükleniyor...")

      // İzmir için tile koordinatlarını hesapla (zoom 12)
      const zoom = 12
      const lat = 38.42
      const lon = 27.14

      // Lat/Lon'dan tile koordinatlarına dönüştürme
      const x = Math.floor(((lon + 180) / 360) * Math.pow(2, zoom))
      const y = Math.floor(
        ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) *
          Math.pow(2, zoom),
      )

      console.log(`İzmir tile koordinatları: zoom=${zoom}, x=${x}, y=${y}`)

      // TomTom Traffic vector tile URL'i (verdiğin kod yapısını kullanarak)
      const url = `https://api.tomtom.com/traffic/map/4/tile/flow/relative/${zoom}/${x}/${y}.pbf?margin=0.1&tags=%5Btraffic_level%2Ctraffic_road_coverage%2Cleft_hand_traffic%2Croad_closure%2Croad_category%2Croad_subcategory%5D&key=${TOMTOM_API_KEY}`

      console.log("TomTom tile URL:", url)

      // Vector tile'ı fetch et
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Tile alınamadı: ${response.status}`)
      }

      const buffer = await response.arrayBuffer()
      console.log("✅ TomTom vector tile alındı, boyut:", buffer.byteLength)

      // Vector tile'ı parse et ve haritaya ekle
      await parseAndAddVectorTile(buffer, x, y, zoom)

      // Simüle edilmiş trafik seviyesi
      const trafficLevels = ["low", "medium", "high"] as const
      setTrafficLevel(trafficLevels[Math.floor(Math.random() * trafficLevels.length)])

      // Simüle edilmiş olaylar
      setIncidents([
        { id: "1", type: "accident", location: "Alsancak" },
        { id: "2", type: "construction", location: "Bornova" },
      ])

      setConnectionStatus("online")
      console.log("✅ TomTom trafik verileri yüklendi")
    } catch (error) {
      console.warn("⚠️ Trafik vector tile'ları yüklenemedi:", error)
      setConnectionStatus("offline")

      // Fallback: Basit trafik katmanı ekle
      addFallbackTrafficLayer()
    }
  }

  const parseAndAddVectorTile = async (buffer: ArrayBuffer, x: number, y: number, zoom: number) => {
    try {
      // Vector tile parsing için dinamik import
      const { VectorTile } = await import("@mapbox/vector-tile")
      const Protobuf = (await import("pbf")).default

      const tile = new VectorTile(new Protobuf(buffer))
      console.log("Vector tile layers:", Object.keys(tile.layers))

      // Her layer için feature'ları oku (verdiğin kod yapısını kullanarak)
      Object.keys(tile.layers).forEach((layerName) => {
        const layer = tile.layers[layerName]
        console.log(`Layer ${layerName}: ${layer.length} features`)

        const features: any[] = []

        for (let i = 0; i < layer.length; i++) {
          try {
            const feature = layer.feature(i).toGeoJSON(x, y, zoom)
            features.push(feature)
          } catch (featureError) {
            console.warn(`Feature ${i} parse hatası:`, featureError)
          }
        }

        if (features.length > 0) {
          addTrafficLayerToMap(layerName, features)
        }
      })
    } catch (error) {
      console.error("Vector tile parsing hatası:", error)
      throw error
    }
  }

  const addTrafficLayerToMap = (layerName: string, features: any[]) => {
    try {
      if (!mapRef.current) return

      const sourceId = `traffic-${layerName}`
      const layerId = `traffic-layer-${layerName}`

      // Source ekle
      if (!mapRef.current.getSource(sourceId)) {
        mapRef.current.addSource(sourceId, {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: features,
          },
        })

        // Layer ekle (trafik seviyesine göre renklendirme)
        mapRef.current.addLayer({
          id: layerId,
          type: "line",
          source: sourceId,
          paint: {
            "line-color": [
              "case",
              ["==", ["get", "traffic_level"], 0],
              "#00FF00", // Yeşil - Akıcı
              ["==", ["get", "traffic_level"], 1],
              "#FFFF00", // Sarı - Orta
              ["==", ["get", "traffic_level"], 2],
              "#FF8000", // Turuncu - Yavaş
              ["==", ["get", "traffic_level"], 3],
              "#FF4000", // Kırmızı - Yoğun
              ["==", ["get", "traffic_level"], 4],
              "#FF0000", // Koyu kırmızı - Çok yoğun
              "#007cbf", // Mavi - Varsayılan
            ],
            "line-width": ["interpolate", ["linear"], ["zoom"], 10, 2, 15, 4, 18, 8],
            "line-opacity": 0.8,
          },
        })

        console.log(`✅ Layer ${layerName} eklendi: ${features.length} features`)
      }
    } catch (error) {
      console.warn(`Layer ${layerName} eklenemedi:`, error)
    }
  }

  const addFallbackTrafficLayer = () => {
    try {
      if (!mapRef.current) return

      console.log("🔄 Fallback trafik katmanı ekleniyor...")

      // Basit trafik simülasyonu
      const izmir_roads = [
        {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [
              [27.13, 38.43], // Alsancak
              [27.14, 38.42], // Konak
              [27.15, 38.41], // Güzelyalı
            ],
          },
          properties: { traffic_level: 2, name: "Kordon Yolu" },
        },
        {
          type: "Feature",
          geometry: {
            type: "LineString",
            coordinates: [
              [27.14, 38.42], // Konak
              [27.2, 38.45], // Bornova yönü
              [27.22, 38.47], // Bornova
            ],
          },
          properties: { traffic_level: 3, name: "Bornova Yolu" },
        },
      ]

      mapRef.current.addSource("fallback-traffic", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: izmir_roads,
        },
      })

      mapRef.current.addLayer({
        id: "fallback-traffic-layer",
        type: "line",
        source: "fallback-traffic",
        paint: {
          "line-color": [
            "case",
            ["==", ["get", "traffic_level"], 0],
            "#00FF00",
            ["==", ["get", "traffic_level"], 1],
            "#FFFF00",
            ["==", ["get", "traffic_level"], 2],
            "#FF8000",
            ["==", ["get", "traffic_level"], 3],
            "#FF4000",
            "#007cbf",
          ],
          "line-width": 4,
          "line-opacity": 0.8,
        },
      })

      console.log("✅ Fallback trafik katmanı eklendi")
    } catch (error) {
      console.warn("Fallback trafik katmanı eklenemedi:", error)
    }
  }

  const addMapControls = () => {
    try {
      if (!mapRef.current || !window.tt) return

      // Zoom kontrolleri
      mapRef.current.addControl(new window.tt.NavigationControl(), "top-right")

      // Fullscreen kontrolü
      mapRef.current.addControl(new window.tt.FullscreenControl(), "top-right")

      console.log("✅ TomTom harita kontrolleri eklendi")
    } catch (error) {
      console.warn("⚠️ Harita kontrolleri eklenemedi:", error)
    }
  }

  const handleMapError = () => {
    console.log("🔄 TomTom harita hata yönetimi")
    setIsLoading(false)
    setMapLoaded(false)
    setConnectionStatus("offline")
  }

  const cleanupMap = () => {
    try {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    } catch (error) {
      console.warn("⚠️ TomTom harita temizleme hatası:", error)
    }
  }

  const refreshMap = async () => {
    console.log("🔄 TomTom haritası yenileniyor...")
    setIsLoading(true)

    try {
      await loadTrafficVectorTiles()
    } catch (error) {
      console.warn("Map refresh error:", error)
    } finally {
      setTimeout(() => setIsLoading(false), 1000)
    }
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

  return (
    <div className="relative h-[500px] w-full">
      {/* Map Container */}
      <div ref={mapElement} className="w-full h-full rounded-lg bg-gray-100" style={{ minHeight: "500px" }}>
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <RefreshCw className="w-8 h-8 mx-auto mb-4 animate-spin text-blue-600" />
              <p className="text-lg font-medium mb-2">TomTom Vector Tiles Yükleniyor</p>
              <p className="text-sm">TomTom trafik vector tile'ları işleniyor...</p>
            </div>
          </div>
        )}

        {/* Offline State */}
        {!isLoading && !mapLoaded && connectionStatus === "offline" && (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-600">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <WifiOff className="w-8 h-8 text-red-600" />
              </div>
              <p className="text-lg font-medium mb-2">TomTom Haritası Erişilemez</p>
              <p className="text-sm mb-4">TomTom Maps API bağlantısı kurulamadı</p>
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
            <span>TomTom vector tiles güncelleniyor...</span>
          </div>
        </div>
      )}

      {/* Controls Overlay */}
      {mapLoaded && (
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <Button size="sm" variant="secondary" onClick={refreshMap} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>

          <Badge className={`${getTrafficLevelColor()} text-white`}>
            <Zap className="h-3 w-3 mr-1" />
            Trafik: {getTrafficLevelText()}
          </Badge>

          {incidents.length > 0 && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              {incidents.length} Olay
            </Badge>
          )}

          <Badge variant="default" className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            TomTom Vector
          </Badge>
        </div>
      )}

      {/* TomTom Legend */}
      {mapLoaded && (
        <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg">
          <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <Zap className="h-4 w-4 text-blue-600" />
            TomTom Vector Tiles
          </h4>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-1 bg-green-500 rounded"></div>
              <span>Akıcı Trafik (Level 0)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-1 bg-yellow-500 rounded"></div>
              <span>Orta Yoğunluk (Level 1)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-1 bg-orange-500 rounded"></div>
              <span>Yavaş Trafik (Level 2)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-1 bg-red-400 rounded"></div>
              <span>Yoğun Trafik (Level 3)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-1 bg-red-600 rounded"></div>
              <span>Çok Yoğun (Level 4)</span>
            </div>
          </div>
        </div>
      )}

      {/* TomTom Status */}
      {mapLoaded && (
        <div className="absolute bottom-4 right-4 bg-white p-2 rounded-lg shadow-lg text-xs text-gray-600">
          <div className="flex items-center gap-2">
            <span>TomTom Vector Tiles • Traffic Flow API • Gerçek Zamanlı</span>
            <div
              className={`w-2 h-2 rounded-full ${connectionStatus === "online" ? "bg-green-500" : "bg-red-500"}`}
            ></div>
          </div>
          <div className="text-xs text-gray-500 mt-1">Son güncelleme: {new Date().toLocaleTimeString("tr-TR")}</div>
        </div>
      )}
    </div>
  )
}

export default TomTomTrafficMap
