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
    const { origin, destination, routeType = "fastest", traffic = true, alternatives = 3 } = body

    console.log("Route calculation request:", { origin, destination, routeType, traffic, alternatives })

    if (!origin || !destination) {
      return NextResponse.json({ error: "Origin and destination are required" }, { status: 400, headers })
    }

    // Geocode origin and destination with better error handling
    console.log("Starting geocoding...")
    const [originCoords, destCoords] = await Promise.all([geocodeLocation(origin), geocodeLocation(destination)])

    console.log("Geocoded coordinates:", { origin: originCoords, destination: destCoords })

    if (!originCoords) {
      return NextResponse.json({ error: `Could not find location: ${origin}` }, { status: 400, headers })
    }

    if (!destCoords) {
      return NextResponse.json({ error: `Could not find location: ${destination}` }, { status: 400, headers })
    }

    // Calculate routes with different strategies
    console.log("Calculating routes...")
    const routePromises = [
      // Route 1: Fastest with traffic
      calculateSingleRoute(originCoords, destCoords, {
        routeType: "fastest",
        traffic: true,
        avoid: [],
        description: "En Hızlı Rota",
      }),

      // Route 2: Shortest distance
      calculateSingleRoute(originCoords, destCoords, {
        routeType: "shortest",
        traffic: true,
        avoid: [],
        description: "En Kısa Rota",
      }),

      // Route 3: Eco-friendly
      calculateSingleRoute(originCoords, destCoords, {
        routeType: "eco",
        traffic: true,
        avoid: ["tollRoads"],
        description: "Ekonomik Rota",
      }),
    ]

    const routeResults = await Promise.allSettled(routePromises)
    const successfulRoutes = routeResults
      .filter((result) => result.status === "fulfilled")
      .map((result) => (result as PromiseFulfilledResult<any>).value)
      .filter((route) => route !== null)

    console.log(`Successfully calculated ${successfulRoutes.length} routes`)

    if (successfulRoutes.length === 0) {
      return NextResponse.json(
        { error: "No routes could be calculated between these locations" },
        { status: 404, headers },
      )
    }

    // Sort routes by travel time (fastest first)
    successfulRoutes.sort((a, b) => a.summary.travelTimeInSeconds - b.summary.travelTimeInSeconds)

    const responseData = {
      routes: successfulRoutes,
      summary: {
        totalRoutes: successfulRoutes.length,
        fastestTime: successfulRoutes[0]?.summary.travelTimeInSeconds,
        shortestDistance: Math.min(...successfulRoutes.map((r) => r.summary.lengthInMeters)),
        origin: originCoords,
        destination: destCoords,
        timestamp: new Date().toISOString(),
      },
    }

    return NextResponse.json(responseData, { headers })
  } catch (error) {
    console.error("Routing API error:", error)

    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
        routes: [], // Fallback empty array
      },
      { status: 500, headers },
    )
  }
}

async function calculateSingleRoute(
  originCoords: string,
  destCoords: string,
  options: { routeType: string; traffic: boolean; avoid: string[]; description: string },
): Promise<any> {
  try {
    const avoidParams = options.avoid.length > 0 ? `&avoid=${options.avoid.join(",")}` : ""
    const routeUrl = `https://api.tomtom.com/routing/1/calculateRoute/${originCoords}:${destCoords}/json?key=${TOMTOM_API_KEY}&traffic=${options.traffic}&routeType=${options.routeType}&instructionsType=text&language=tr-TR&computeBestOrder=false&sectionType=traffic${avoidParams}`

    console.log(`Calculating ${options.description}:`, routeUrl)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 20000) // 20 second timeout

    const response = await fetch(routeUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent": "TrafficApp/1.0",
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error(`TomTom Routing API error for ${options.description}: ${response.status} ${response.statusText}`)
      const errorText = await response.text()
      console.error("Error response:", errorText)
      return null
    }

    const data = await response.json()

    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0]
      route._description = options.description
      return route
    }

    console.log(`No routes found for ${options.description}`)
    return null
  } catch (error) {
    if (error.name === "AbortError") {
      console.error(`Route calculation timeout for ${options.description}`)
    } else {
      console.error(`Single route calculation error for ${options.description}:`, error)
    }
    return null
  }
}

async function geocodeLocation(location: string): Promise<string | null> {
  try {
    // Clean and prepare the location string
    const cleanLocation = location.trim()
    const geocodeUrl = `https://api.tomtom.com/search/2/geocode/${encodeURIComponent(cleanLocation)}.json?key=${TOMTOM_API_KEY}&countrySet=TR&limit=1&typeahead=false`

    console.log("Geocoding:", cleanLocation)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const response = await fetch(geocodeUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent": "TrafficApp/1.0",
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      console.error(`Geocoding error for ${location}: ${response.status}`)
      const errorText = await response.text()
      console.error("Geocoding error response:", errorText)
      return null
    }

    const data = await response.json()

    if (data.results && data.results.length > 0) {
      const result = data.results[0]
      const coords = `${result.position.lat},${result.position.lon}`
      console.log(`Geocoded ${location} to ${coords}`)
      return coords
    }

    console.log(`No geocoding results for ${location}`)
    return null
  } catch (error) {
    if (error.name === "AbortError") {
      console.error(`Geocoding timeout for ${location}`)
    } else {
      console.error(`Geocoding error for ${location}:`, error)
    }
    return null
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
