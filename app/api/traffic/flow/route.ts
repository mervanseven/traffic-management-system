import type { NextRequest } from "next/server"

const TOMTOM_API_KEY = "vxNgHq8W1x8soPbMdhwWqgyDrT6ZVMXf"

// Mock veri - API çağrısı başarısız olursa kullanılacak
const mockFlowData = {
  flowSegmentData: {
    frc: "FRC0",
    currentSpeed: 45,
    freeFlowSpeed: 60,
    currentTravelTime: 120,
    freeFlowTravelTime: 90,
    confidence: 0.9,
    roadClosure: false,
    coordinates: {
      coordinate: [{ latitude: 38.42, longitude: 27.14 }],
    },
    timestamp: new Date().toISOString(),
  },
}

export async function GET(request: NextRequest) {
  // CORS başlıkları
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "\
