import { type NextRequest, NextResponse } from "next/server"
import { URL } from "url"

// OpenRouteService API - Ücretsiz 2000 istek/gün
const ORS_API_KEY = "5b3ce3597851110001cf6248a1b2c9c7b8e84c8bb2b54f7b8b6c8f7e"

export async function GET(request: NextRequest) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  }

  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")

    if (!query) {
      return NextResponse.json({ error: "Query parameter is required" }, { status: 400, headers })
    }

    console.log("Geocoding request:", query)

    // OpenRouteService Geocoding API
    const url = `https://api.openrouteservice.org/geocode/search?api_key=${ORS_API_KEY}&text=${encodeURIComponent(query)}&boundary.country=TR&size=5`

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000)

    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "TrafficApp/1.0",
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`Geocoding API Error: ${response.status}`)
      }

      const data = await response.json()
      console.log("Geocoding response:", data)

      if (data.features && data.features.length > 0) {
        const results = data.features.map((feature: any) => ({
          name: feature.properties.label,
          coordinates: feature.geometry.coordinates, // [lng, lat]
          confidence: feature.properties.confidence || 0.5,
          region: feature.properties.region || "Türkiye",
          locality: feature.properties.locality || "",
        }))

        return NextResponse.json({ results }, { headers })
      } else {
        return NextResponse.json({ results: [] }, { headers })
      }
    } catch (fetchError) {
      console.error("Geocoding fetch error:", fetchError)

      // Fallback: Türkiye'deki bilinen şehirler
      const fallbackResults = getFallbackLocations(query)
      return NextResponse.json({ results: fallbackResults }, { headers })
    }
  } catch (error) {
    console.error("Geocoding API error:", error)

    // Fallback sonuçlar döndür
    const fallbackResults = getFallbackLocations(request.url.searchParams.get("q") || "")
    return NextResponse.json({ results: fallbackResults }, { headers })
  }
}

function getFallbackLocations(query: string) {
  const locations = [
    { name: "İzmir, Türkiye", coordinates: [27.14, 38.42], confidence: 0.9, region: "İzmir", locality: "İzmir" },
    { name: "Alsancak, İzmir", coordinates: [27.13, 38.43], confidence: 0.8, region: "İzmir", locality: "Konak" },
    { name: "Bornova, İzmir", coordinates: [27.22, 38.47], confidence: 0.8, region: "İzmir", locality: "Bornova" },
    { name: "Karşıyaka, İzmir", coordinates: [27.1, 38.46], confidence: 0.8, region: "İzmir", locality: "Karşıyaka" },
    { name: "Konak, İzmir", coordinates: [27.14, 38.41], confidence: 0.8, region: "İzmir", locality: "Konak" },
    { name: "Bayraklı, İzmir", coordinates: [27.16, 38.46], confidence: 0.8, region: "İzmir", locality: "Bayraklı" },
    { name: "Gaziemir, İzmir", coordinates: [27.18, 38.32], confidence: 0.8, region: "İzmir", locality: "Gaziemir" },
    { name: "Mavişehir, İzmir", coordinates: [27.05, 38.48], confidence: 0.8, region: "İzmir", locality: "Karşıyaka" },
  ]

  const lowerQuery = query.toLowerCase()
  return locations
    .filter((loc) => loc.name.toLowerCase().includes(lowerQuery) || loc.locality.toLowerCase().includes(lowerQuery))
    .slice(0, 3)
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
