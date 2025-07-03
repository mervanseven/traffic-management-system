import { type NextRequest, NextResponse } from "next/server"

const TOMTOM_API_KEY = "vxNgHq8W1x8soPbMdhwWqgyDrT6ZVMXf"

// Mock veri - API çağrısı başarısız olursa kullanılacak
const mockIncidents = {
  incidents: [
    {
      properties: {
        id: "mock-1",
        iconCategory: 1,
        magnitudeOfDelay: 2,
        events: [{ description: "Alsancak Kordon'da yoğun trafik" }],
        startTime: new Date().toISOString(),
      },
      geometry: {
        coordinates: [[27.13, 38.43]],
      },
    },
    {
      properties: {
        id: "mock-2",
        iconCategory: 7,
        magnitudeOfDelay: 1,
        events: [{ description: "Bornova Kavşağı'nda yol çalışması" }],
        startTime: new Date().toISOString(),
      },
      geometry: {
        coordinates: [[27.22, 38.47]],
      },
    },
    {
      properties: {
        id: "mock-3",
        iconCategory: 1,
        magnitudeOfDelay: 3,
        events: [{ description: "Karşıyaka'da trafik kazası" }],
        startTime: new Date().toISOString(),
      },
      geometry: {
        coordinates: [[27.1, 38.46]],
      },
    },
  ],
  summary: {
    total: 3,
    timestamp: new Date().toISOString(),
  },
}

export async function GET(request: NextRequest) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Cache-Control": "no-cache, no-store, must-revalidate",
  }

  try {
    const { searchParams } = new URL(request.url)
    const bbox = searchParams.get("bbox")
    const language = searchParams.get("language") || "tr-TR"
    const categoryFilter = searchParams.get("categoryFilter") || "0,1,2,3,4,5,6,7,8,9,10,11,14"

    console.log("Incidents request:", { bbox, language, categoryFilter })

    if (!bbox) {
      return NextResponse.json({ error: "Bbox parameter is required" }, { status: 400, headers })
    }

    const url = `https://api.tomtom.com/traffic/services/5/incidentDetails?bbox=${encodeURIComponent(bbox)}&language=${language}&categoryFilter=${categoryFilter}&timeValidityFilter=present&key=${TOMTOM_API_KEY}`

    console.log("Fetching incidents from:", url)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 saniye timeout

    try {
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "TrafficApp/1.0",
        },
        signal: controller.signal,
        cache: "no-store", // Her zaman yeni veri al
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        console.error(`TomTom Incidents API error: ${response.status} ${response.statusText}`)
        throw new Error(`API Error: ${response.status}`)
      }

      const data = await response.json()
      console.log("Incidents data received:", data)

      // Tutarlı bir yapı döndür
      const responseData = {
        incidents: data.incidents || [],
        tm: data.tm || {},
        summary: {
          total: data.incidents?.length || 0,
          timestamp: new Date().toISOString(),
        },
      }

      return NextResponse.json(responseData, { headers })
    } catch (fetchError) {
      console.error("Fetch error:", fetchError)

      // API çağrısı başarısız olursa mock veri döndür
      console.log("Returning mock incidents data")
      return NextResponse.json(mockIncidents, { headers })
    }
  } catch (error) {
    console.error("Traffic incidents API error:", error)

    // Herhangi bir hata durumunda mock veri döndür
    console.log("Returning mock incidents data due to error")
    return NextResponse.json(mockIncidents, { headers })
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
