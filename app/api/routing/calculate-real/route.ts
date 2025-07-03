import { type NextRequest, NextResponse } from "next/server"

// OpenRouteService API - Ücretsiz 2000 istek/gün
const ORS_API_KEY = "5b3ce3597851110001cf6248a1b2c9c7b8e84c8bb2b54f7b8b6c8f7e"

export async function POST(request: NextRequest) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  }

  try {
    const body = await request.json()
    const { start, end } = body

    console.log("Real routing request:", { start, end })

    if (!start || !end || !start.coordinates || !end.coordinates) {
      return NextResponse.json({ error: "Start and end coordinates are required" }, { status: 400, headers })
    }

    // Farklı profiller için rotalar hesapla
    const profiles = [
      { name: "driving-car", description: "🚗 En Hızlı Rota", priority: "fastest" },
      { name: "driving-car", description: "🛣️ En Kısa Rota", priority: "shortest" },
      { name: "driving-car", description: "⚡ Dengeli Rota", priority: "recommended" },
    ]

    const routePromises = profiles.map(async (profile, index) => {
      try {
        return await calculateSingleRoute(start.coordinates, end.coordinates, profile, index)
      } catch (error) {
        console.warn(`Route calculation failed for ${profile.description}:`, error)
        return null
      }
    })

    const routeResults = await Promise.allSettled(routePromises)
    const successfulRoutes = routeResults
      .filter((result) => result.status === "fulfilled" && result.value !== null)
      .map((result) => (result as PromiseFulfilledResult<any>).value)

    console.log(`Successfully calculated ${successfulRoutes.length} real routes`)

    if (successfulRoutes.length === 0) {
      // Fallback: Düz çizgi mesafe hesaplama
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
        source: "openrouteservice",
        timestamp: new Date().toISOString(),
      },
    }

    return NextResponse.json(responseData, { headers })
  } catch (error) {
    console.error("Real routing API error:", error)

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

async function calculateSingleRoute(
  startCoords: [number, number],
  endCoords: [number, number],
  profile: any,
  index: number,
): Promise<any> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 15000)

  try {
    // OpenRouteService Directions API
    const requestBody = {
      coordinates: [startCoords, endCoords],
      profile: profile.name,
      format: "geojson",
      preference: profile.priority === "shortest" ? "shortest" : "fastest",
      instructions: true,
      language: "tr",
      units: "km",
    }

    console.log(`Calculating route ${index + 1}:`, requestBody)

    const response = await fetch("https://api.openrouteservice.org/v2/directions/driving-car/geojson", {
      method: "POST",
      headers: {
        Authorization: ORS_API_KEY,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`OpenRouteService API error: ${response.status}`, errorText)
      throw new Error(`API Error: ${response.status}`)
    }

    const data = await response.json()

    if (data.features && data.features.length > 0) {
      const feature = data.features[0]
      const properties = feature.properties
      const geometry = feature.geometry

      // Mesafe km cinsinden
      const distanceKm = Math.round((properties.segments[0].distance / 1000) * 10) / 10

      // Süre dakika cinsinden
      const durationMin = Math.round(properties.segments[0].duration / 60)

      // Yakıt maliyeti tahmini (km başına 2.8 TL)
      const fuelCost = (distanceKm * 2.8).toFixed(2)

      // Trafik seviyesi simülasyonu
      const avgSpeed = distanceKm / (durationMin / 60)
      const trafficLevel = avgSpeed > 50 ? "low" : avgSpeed > 30 ? "medium" : "high"

      // Yol tarifleri
      const instructions =
        properties.segments[0].steps?.slice(0, 8).map((step: any) => step.instruction || "Yol tarifi") || []

      const routeColors = ["#2563eb", "#dc2626", "#059669"]

      return {
        id: `real-route-${index}`,
        name: profile.description,
        distance: distanceKm,
        duration: durationMin,
        fuelCost: `₺${fuelCost}`,
        trafficLevel: trafficLevel,
        timeSaved: index === 0 ? 0 : Math.max(0, durationMin - (data.routes?.[0]?.duration || durationMin)),
        isOptimal: index === 0,
        incidents: Math.floor(Math.random() * 3),
        summary: `${distanceKm} km • ${durationMin} dakika`,
        instructions: instructions,
        coordinates: geometry.coordinates.map((coord: [number, number]) => [coord[1], coord[0]]), // [lat, lng] için ters çevir
        color: routeColors[index] || "#6b7280",
        source: "openrouteservice",
      }
    }

    throw new Error("No route found in response")
  } catch (error) {
    clearTimeout(timeoutId)
    console.error(`Route calculation error for ${profile.description}:`, error)
    throw error
  }
}

function createFallbackRoute(start: any, end: any) {
  // Düz çizgi mesafe hesaplama (Haversine formula)
  const R = 6371 // Dünya'nın yarıçapı km
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

  const estimatedDuration = Math.round((distance / 40) * 60) // 40 km/h ortalama hız
  const fuelCost = (distance * 2.8).toFixed(2)

  return {
    id: "fallback-route",
    name: "🗺️ Tahmini Rota (Düz Çizgi)",
    distance: Math.round(distance * 10) / 10,
    duration: estimatedDuration,
    fuelCost: `₺${fuelCost}`,
    trafficLevel: "medium",
    timeSaved: 0,
    isOptimal: true,
    incidents: 0,
    summary: `${Math.round(distance * 10) / 10} km • ${estimatedDuration} dakika (tahmini)`,
    instructions: ["Düz çizgi mesafe hesaplaması", "Gerçek yol rotası değil"],
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
