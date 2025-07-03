import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Activity, AlertTriangle, Navigation, Clock, TrendingUp, Bell } from "lucide-react"
import Link from "next/link"
import ClientWidgets from "../components/client.widgets" // bu satır önemli

const quickStats = [
  {
    title: "Aktif Trafik Akışı",
    value: "Normal",
    subtext: "Ortalama hız: 45 km/h",
    icon: Activity,
    color: "text-green-600",
  },
  {
    title: "Aktif Olaylar",
    value: "3",
    subtext: "2 kaza, 1 yol çalışması",
    icon: AlertTriangle,
    color: "text-orange-600",
  },
  {
    title: "Optimize Edilen Rotalar",
    value: "127",
    subtext: "Son 1 saatte",
    icon: Navigation,
    color: "text-blue-600",
  },
  {
    title: "Zaman Tasarrufu",
    value: "23 dk",
    subtext: "Ortalama tasarruf",
    icon: Clock,
    color: "text-purple-600",
  },
]

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Trafik Analiz ve Yönetim Sistemi</h1>
          <p className="text-gray-600">Gerçek zamanlı trafik verilerini analiz edin ve akıllı rota önerileri alın</p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickStats.map((stat, index) => (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.subtext}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Client-side Bileşenler */}
        <ClientWidgets />

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4">
          <Link href="/route-optimizer">
            <Button className="flex items-center gap-2">
              <Navigation className="h-4 w-4" />
              Rota Optimizasyonu
            </Button>
          </Link>

          <Link href="/analytics">
            <Button variant="outline" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Detaylı Analiz
            </Button>
          </Link>

          <Link href="/alerts">
            <Button variant="outline" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Uyarı Ayarları
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
