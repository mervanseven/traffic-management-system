"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, TrendingUp, Clock, MapPin, Download, Filter } from "lucide-react"

export default function Analytics() {
  const trafficData = [
    { hour: "06:00", level: 20 },
    { hour: "07:00", level: 45 },
    { hour: "08:00", level: 80 },
    { hour: "09:00", level: 65 },
    { hour: "10:00", level: 40 },
    { hour: "11:00", level: 35 },
    { hour: "12:00", level: 50 },
    { hour: "13:00", level: 55 },
    { hour: "14:00", level: 45 },
    { hour: "15:00", level: 40 },
    { hour: "16:00", level: 60 },
    { hour: "17:00", level: 85 },
    { hour: "18:00", level: 90 },
    { hour: "19:00", level: 70 },
    { hour: "20:00", level: 45 },
    { hour: "21:00", level: 30 },
    { hour: "22:00", level: 25 },
    { hour: "23:00", level: 15 },
  ]

  const hotspots = [
    { name: "Alsancak - Kordon", incidents: 12, avgDelay: "8 dk" },
    { name: "Bornova Kavşağı", incidents: 8, avgDelay: "6 dk" },
    { name: "Karşıyaka İskelesi", incidents: 6, avgDelay: "4 dk" },
    { name: "Konak Meydanı", incidents: 5, avgDelay: "5 dk" },
    { name: "Mavişehir Köprüsü", incidents: 4, avgDelay: "3 dk" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">Trafik Analitiği</h1>
              <p className="text-gray-600">Detaylı trafik verilerini analiz edin ve trendleri keşfedin</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Filtrele
              </Button>
              <Button className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                Rapor İndir
              </Button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Günlük Ortalama Hız</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">42 km/h</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+5%</span> geçen haftaya göre
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Toplam Olay Sayısı</CardTitle>
              <BarChart3 className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">35</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-red-600">+12%</span> geçen haftaya göre
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ortalama Gecikme</CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">6.2 dk</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">-8%</span> geçen haftaya göre
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Optimize Edilen Rotalar</CardTitle>
              <MapPin className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,247</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+23%</span> geçen haftaya göre
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Analytics Tabs */}
        <Tabs defaultValue="hourly" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="hourly">Saatlik Analiz</TabsTrigger>
            <TabsTrigger value="hotspots">Problem Noktaları</TabsTrigger>
            <TabsTrigger value="trends">Trendler</TabsTrigger>
          </TabsList>

          <TabsContent value="hourly">
            <Card>
              <CardHeader>
                <CardTitle>Saatlik Trafik Yoğunluğu</CardTitle>
                <CardDescription>Bugünkü trafik yoğunluğunun saatlik dağılımı</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {trafficData.map((data, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="w-16 text-sm font-medium">{data.hour}</div>
                      <div className="flex-1 bg-gray-200 rounded-full h-6 relative">
                        <div
                          className={`h-6 rounded-full transition-all duration-300 ${
                            data.level > 70 ? "bg-red-500" : data.level > 40 ? "bg-yellow-500" : "bg-green-500"
                          }`}
                          style={{ width: `${data.level}%` }}
                        />
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                          {data.level}%
                        </span>
                      </div>
                      <Badge
                        className={
                          data.level > 70
                            ? "bg-red-100 text-red-800"
                            : data.level > 40
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                        }
                      >
                        {data.level > 70 ? "Yoğun" : data.level > 40 ? "Orta" : "Düşük"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="hotspots">
            <Card>
              <CardHeader>
                <CardTitle>Trafik Problem Noktaları</CardTitle>
                <CardDescription>En çok olay yaşanan ve gecikme olan bölgeler</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {hotspots.map((hotspot, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-semibold">{hotspot.name}</h4>
                        <p className="text-sm text-gray-600">
                          {hotspot.incidents} olay • Ortalama gecikme: {hotspot.avgDelay}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={index < 2 ? "destructive" : index < 4 ? "default" : "secondary"}>
                          #{index + 1}
                        </Badge>
                        <Button variant="outline" size="sm">
                          Detay
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Haftalık Trend</CardTitle>
                  <CardDescription>Son 7 günün karşılaştırması</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"].map((day, index) => {
                      const value = Math.floor(Math.random() * 40) + 30
                      return (
                        <div key={day} className="flex items-center justify-between">
                          <span className="text-sm font-medium w-20">{day}</span>
                          <div className="flex-1 mx-4 bg-gray-200 rounded-full h-2">
                            <div className="h-2 bg-blue-500 rounded-full" style={{ width: `${value}%` }} />
                          </div>
                          <span className="text-sm text-gray-600 w-12">{value}%</span>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Aylık Karşılaştırma</CardTitle>
                  <CardDescription>Bu ay vs geçen ay</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Ortalama Hız</span>
                        <span className="text-sm text-green-600">+5.2%</span>
                      </div>
                      <div className="text-2xl font-bold">42.3 km/h</div>
                      <p className="text-xs text-gray-600">Geçen ay: 40.2 km/h</p>
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Toplam Olaylar</span>
                        <span className="text-sm text-red-600">+12.8%</span>
                      </div>
                      <div className="text-2xl font-bold">847</div>
                      <p className="text-xs text-gray-600">Geçen ay: 751</p>
                    </div>

                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">Zaman Tasarrufu</span>
                        <span className="text-sm text-green-600">+18.5%</span>
                      </div>
                      <div className="text-2xl font-bold">2,340 dk</div>
                      <p className="text-xs text-gray-600">Geçen ay: 1,975 dk</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
