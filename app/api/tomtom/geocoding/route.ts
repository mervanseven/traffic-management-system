import { type NextRequest, NextResponse } from "next/server"

const TOMTOM_API_KEY = "vxNgHq8W1x8soPbMdhwWqgyDrT6ZVMXf"

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

    console.log("TomTom Geocoding request:", query)

    // TomTom Search API - Geocoding
    const url = `https://api.tomtom.com/search/2/geocode/${encodeURIComponent(query)}.json?key=${TOMTOM_API_KEY}&countrySet=TR&limit=5&typeahead=false`

    console.log("TomTom URL:", url)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "TrafficApp/1.0",
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error(`TomTom Geocoding API error: ${response.status}`)
      const errorText = await response.text()
      console.error("Error response:", errorText)
      throw new Error(`TomTom API Error: ${response.status}`)
    }

    const data = await response.json()
    console.log("TomTom Geocoding response:", data)

    if (data.results && data.results.length > 0) {
      const results = data.results.map((result: any) => ({
        name: result.address?.freeformAddress || result.poi?.name || "Bilinmeyen Konum",
        coordinates: [result.position.lon, result.position.lat], // [lng, lat]
        confidence: result.score || 0.5,
        region: result.address?.countrySubdivision || "Türkiye",
        locality: result.address?.municipality || result.address?.localName || "",
        address: result.address?.freeformAddress || "",
        type: result.type || "Point Address",
      }))

      return NextResponse.json({ results, success: true }, { headers })
    } else {
      console.log("No results found for:", query)
      return NextResponse.json({ results: [], success: true }, { headers })
    }
  } catch (error) {
    console.error("TomTom Geocoding API error:", error)

    // Fallback: Türkiye'deki bilinen konumlar
    const fallbackResults = getFallbackLocations(request.url.split("q=")[1]?.split("&")[0] || "")
    return NextResponse.json(
      {
        results: fallbackResults,
        success: false,
        error: "TomTom API unavailable, using fallback",
      },
      { headers },
    )
  }
}

function getFallbackLocations(query: string) {
  const locations = [
    {
      name: "Alsancak, İzmir",
      coordinates: [27.13, 38.43],
      confidence: 0.9,
      region: "İzmir",
      locality: "Konak",
      address: "Alsancak, Konak, İzmir",
      type: "Point Address",
    },
    {
      name: "Bornova, İzmir",
      coordinates: [27.22, 38.47],
      confidence: 0.9,
      region: "İzmir",
      locality: "Bornova",
      address: "Bornova, İzmir",
      type: "Point Address",
    },
    {
      name: "Karşıyaka, İzmir",
      coordinates: [27.1, 38.46],
      confidence: 0.9,
      region: "İzmir",
      locality: "Karşıyaka",
      address: "Karşıyaka, İzmir",
      type: "Point Address",
    },
    {
      name: "Konak, İzmir",
      coordinates: [27.14, 38.41],
      confidence: 0.9,
      region: "İzmir",
      locality: "Konak",
      address: "Konak, İzmir",
      type: "Point Address",
    },
    {
      name: "İzmir Merkez",
      coordinates: [27.14, 38.42],
      confidence: 0.8,
      region: "İzmir",
      locality: "İzmir",
      address: "İzmir Merkez, İzmir",
      type: "Point Address",
    },
  ]

  if (!query) return locations.slice(0, 3)

  const lowerQuery = decodeURIComponent(query).toLowerCase()
  return locations
    .filter(
      (loc) =>
        loc.name.toLowerCase().includes(lowerQuery) ||
        loc.locality.toLowerCase().includes(lowerQuery) ||
        loc.address.toLowerCase().includes(lowerQuery),
    )
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
