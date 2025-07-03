import { type NextRequest, NextResponse } from "next/server"

const TOMTOM_API_KEY = "vxNgHq8W1x8soPbMdhwWqgyDrT6ZVMXf"

export async function POST(request: NextRequest) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  }

  try {
    const body = await request.json()
    const { start, end } = body

    console.log("TomTom Routing request:", { start, end })

    if (!start?.coordinates || !end?.coordinates) {
      return NextResponse.json({ error: "Start and end coordinates are required" }, { status: 400, headers })
    }

    // TomTom koordinat formatı: lat,lon
    const startCoords = `${start.coordinates[1]},${start.coordinates[0]}`
    const endCoords = `${end.coordinates[1]},${end.coordinates[0]}`

    console.log("TomTom coordinates:", { startCoords, endCoords })

    // Farklı rota seçenekleri hesapla
    const routeOptions = [
      { routeType: "fastest", traffic: true, name: "🚀 En Hızlı Rota (Trafik Dahil)" },
      { routeType: "shortest", traffic: false, name: "📏 En Kısa Rota" },
      { routeType: "eco", traffic: true, name: "🌱 Ekonomik Rota" },
    ]

    const routePromises = routeOptions.map(async (option, index) => {
      try {
        return await calculateTomTomRoute(startCoords, endCoords, option, index)
      } catch (error) {
        console.warn(`Route calculation failed for ${option.name}:`, error)
        return null
      }
    })

    const routeResults = await Promise.allSettled(routePromises)
    const successfulRoutes = routeResults
      .filter((result) => result.status === "fulfilled" && result.value !== null)
      .map((result) => (result as PromiseFulfilledResult<any>).value)

    console.log(`TomTom: Successfully calculated ${successfulRoutes.length} routes`)

    if (successfulRoutes.length === 0) {
      // Fallback route oluştur
      const fallbackRoute = createFallbackRoute(start, end)
      return NextResponse.json(
        {
          routes: [fallbackRoute],
          summary: {
            totalRoutes: 1,
            source: "fallback",
            timestamp: new Date().toISOString(),
          },
        },
        { headers },
      )
    }

    // Rotaları süreye göre sırala
    successfulRoutes.sort((a, b) => a.duration - b.duration)

    const responseData = {
      routes: successfulRoutes,
      summary: {
        totalRoutes: successfulRoutes.length,
        fastestTime: successfulRoutes[0]?.duration,
        shortestDistance: Math.min(...successfulRoutes.map((r) => r.distance)),
        source: "tomtom",
        timestamp: new Date().toISOString(),
      },
    }

    return NextResponse.json(responseData, { headers })
  } catch (error) {
    console.error("TomTom Routing API error:", error)

    // Fallback route oluştur
    const fallbackRoute = createFallbackRoute(
      { coordinates: [27.13, 38.43], name: "Başlangıç" },
      { coordinates: [27.22, 38.47], name: "Varış" },
    )

    return NextResponse.json(
      {
        routes: [fallbackRoute],
        summary: {
          totalRoutes: 1,
          source: "fallback",
          timestamp: new Date().toISOString(),
        },
      },
      { headers },
    )
  }
}

async function calculateTomTomRoute(startCoords: string, endCoords: string, option: any, index: number): Promise<any> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 20000)

  try {
    // TomTom Routing API URL
    const url = `https://api.tomtom.com/routing/1/calculateRoute/${startCoords}:${endCoords}/json?key=${TOMTOM_API_KEY}&traffic=${option.traffic}&routeType=${option.routeType}&instructionsType=text&language=tr-TR&computeBestOrder=false&sectionType=traffic`

    console.log(`TomTom Route ${index + 1} URL:`, url)

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "TrafficApp/1.0",
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`TomTom Routing API error: ${response.status}`, errorText)
      throw new Error(`TomTom API Error: ${response.status}`)
    }

    const data = await response.json()
    console.log(`TomTom Route ${index + 1} response:`, data)

    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0]
      const summary = route.summary

      // Mesafe km cinsinden
      const distanceKm = Math.round((summary.lengthInMeters / 1000) * 10) / 10

      // Süre dakika cinsinden
      const durationMin = Math.round(summary.travelTimeInSeconds / 60)

      // Trafik gecikmesi
      const trafficDelayMin = Math.round((summary.trafficDelayInSeconds || 0) / 60)

      // Yakıt maliyeti tahmini
      const fuelCost = (distanceKm * 2.8).toFixed(2)

      // Trafik seviyesi
      const avgSpeed = distanceKm / (durationMin / 60)
      const trafficLevel = avgSpeed > 50 ? "low" : avgSpeed > 30 ? "medium" : "high"

      // Yol tarifleri
      const instructions =
        route.legs?.[0]?.steps?.slice(0, 8).map((step: any) => step.instruction?.message || "Yol tarifi") || []

      // Koordinatlar (Leaflet için lat,lng formatına çevir)
      const coordinates = route.legs?.[0]?.points?.map((point: any) => [point.latitude, point.longitude]) || [
        [38.43, 27.13],
        [38.47, 27.22],
      ]

      const routeColors = ["#2563eb", "#dc2626", "#059669"]

      return {
        id: `tomtom-route-${index}`,
        name: option.name,
        distance: distanceKm,
        duration: durationMin,
        fuelCost: `₺${fuelCost}`,
        trafficLevel: trafficLevel,
        trafficDelay: trafficDelayMin,
        timeSaved: index === 0 ? 0 : 0, // İlk hesaplamada sıfır
        isOptimal: index === 0,
        incidents: Math.floor(trafficDelayMin / 2),
        summary: `${distanceKm} km • ${durationMin} dakika`,
        instructions: instructions,
        coordinates: coordinates,
        color: routeColors[index] || "#6b7280",
        source: "tomtom",
      }
    }

    throw new Error("No route found in TomTom response")
  } catch (error) {
    clearTimeout(timeoutId)
    console.error(`TomTom route calculation error for ${option.name}:`, error)
    throw error
  }
}

function createFallbackRoute(start: any, end: any) {
  // Düz çizgi mesafe hesaplama
  const R = 6371
  const dLat = ((end.coordinates[1] - start.coordinates[1]) * Math.PI) / 180
  const dLon = ((end.coordinates[0] - start.coordinates[0]) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((start.coordinates[1] * Math.PI) / 180) *
      Math.cos((end.coordinates[1] * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  const estimatedDuration = Math.round((distance / 40) * 60)
  const fuelCost = (distance * 2.8).toFixed(2)

  return {
    id: "fallback-route",
    name: "🗺️ Tahmini Rota (API Erişilemez)",
    distance: Math.round(distance * 10) / 10,
    duration: estimatedDuration,
    fuelCost: `₺${fuelCost}`,
    trafficLevel: "medium",
    trafficDelay: 0,
    timeSaved: 0,
    isOptimal: true,
    incidents: 0,
    summary: `${Math.round(distance * 10) / 10} km • ${estimatedDuration} dakika (tahmini)`,
    instructions: ["TomTom API erişilemez", "Düz çizgi mesafe hesaplaması"],
    coordinates: [
      [start.coordinates[1], start.coordinates[0]],
      [end.coordinates[1], end.coordinates[0]],
    ],
    color: "#6b7280",
    source: "fallback",
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  })
}
