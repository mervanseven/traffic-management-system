"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Bell, Mail, Smartphone, AlertTriangle, Clock, MapPin, Settings, Plus, Trash2 } from "lucide-react"

interface AlertRule {
  id: string
  name: string
  type: "traffic" | "incident" | "route"
  condition: string
  isActive: boolean
  notifications: string[]
}

export default function Alerts() {
  const [alertRules, setAlertRules] = useState<AlertRule[]>([
    {
      id: "1",
      name: "Yoğun Trafik Uyarısı",
      type: "traffic",
      condition: "Trafik yoğunluğu %80'i geçtiğinde",
      isActive: true,
      notifications: ["email", "push"],
    },
    {
      id: "2",
      name: "Kaza Bildirimi",
      type: "incident",
      condition: "Favori rotamda kaza olduğunda",
      isActive: true,
      notifications: ["push", "sms"],
    },
    {
      id: "3",
      name: "Rota Optimizasyonu",
      type: "route",
      condition: "10 dakikadan fazla tasarruf mümkün olduğunda",
      isActive: false,
      notifications: ["email"],
    },
  ])

  const [newRule, setNewRule] = useState({
    name: "",
    type: "traffic" as "traffic" | "incident" | "route",
    condition: "",
    notifications: [] as string[],
  })

  const toggleRule = (id: string) => {
    setAlertRules((rules) => rules.map((rule) => (rule.id === id ? { ...rule, isActive: !rule.isActive } : rule)))
  }

  const deleteRule = (id: string) => {
    setAlertRules((rules) => rules.filter((rule) => rule.id !== id))
  }

  const addRule = () => {
    if (!newRule.name || !newRule.condition) return

    const rule: AlertRule = {
      id: Date.now().toString(),
      ...newRule,
      isActive: true,
    }

    setAlertRules((rules) => [...rules, rule])
    setNewRule({
      name: "",
      type: "traffic",
      condition: "",
      notifications: [],
    })
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "traffic":
        return <AlertTriangle className="h-4 w-4" />
      case "incident":
        return <MapPin className="h-4 w-4" />
      case "route":
        return <Clock className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "traffic":
        return "bg-orange-100 text-orange-800"
      case "incident":
        return "bg-red-100 text-red-800"
      case "route":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getTypeText = (type: string) => {
    switch (type) {
      case "traffic":
        return "Trafik"
      case "incident":
        return "Olay"
      case "route":
        return "Rota"
      default:
        return "Genel"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Uyarı ve Bildirim Sistemi</h1>
          <p className="text-gray-600">Önemli trafik durumları için kişiselleştirilmiş uyarılar oluşturun</p>
        </div>

        <Tabs defaultValue="rules" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="rules">Uyarı Kuralları</TabsTrigger>
            <TabsTrigger value="settings">Bildirim Ayarları</TabsTrigger>
            <TabsTrigger value="history">Uyarı Geçmişi</TabsTrigger>
          </TabsList>

          <TabsContent value="rules">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Existing Rules */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Aktif Uyarı Kuralları</h2>
                  <Badge variant="secondary">{alertRules.filter((rule) => rule.isActive).length} aktif</Badge>
                </div>

                {alertRules.map((rule) => (
                  <Card key={rule.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getTypeIcon(rule.type)}
                          <div>
                            <CardTitle className="text-lg">{rule.name}</CardTitle>
                            <CardDescription>{rule.condition}</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getTypeColor(rule.type)}>{getTypeText(rule.type)}</Badge>
                          <Switch checked={rule.isActive} onCheckedChange={() => toggleRule(rule.id)} />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Bildirim türleri:</span>
                          <div className="flex gap-1">
                            {rule.notifications.includes("email") && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                E-posta
                              </Badge>
                            )}
                            {rule.notifications.includes("push") && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Bell className="h-3 w-3" />
                                Push
                              </Badge>
                            )}
                            {rule.notifications.includes("sms") && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Smartphone className="h-3 w-3" />
                                SMS
                              </Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteRule(rule.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Add New Rule */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Plus className="h-5 w-5" />
                      Yeni Uyarı Kuralı
                    </CardTitle>
                    <CardDescription>Özel uyarı kuralı oluşturun</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="rule-name">Kural Adı</Label>
                      <Input
                        id="rule-name"
                        placeholder="Örn: Sabah Trafiği"
                        value={newRule.name}
                        onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label htmlFor="rule-condition">Koşul</Label>
                      <Input
                        id="rule-condition"
                        placeholder="Örn: Hız 30 km/h altına düştüğünde"
                        value={newRule.condition}
                        onChange={(e) => setNewRule({ ...newRule, condition: e.target.value })}
                      />
                    </div>

                    <div>
                      <Label>Bildirim Türleri</Label>
                      <div className="space-y-2 mt-2">
                        {[
                          { id: "email", label: "E-posta", icon: Mail },
                          { id: "push", label: "Push Bildirimi", icon: Bell },
                          { id: "sms", label: "SMS", icon: Smartphone },
                        ].map(({ id, label, icon: Icon }) => (
                          <div key={id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={id}
                              checked={newRule.notifications.includes(id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewRule({
                                    ...newRule,
                                    notifications: [...newRule.notifications, id],
                                  })
                                } else {
                                  setNewRule({
                                    ...newRule,
                                    notifications: newRule.notifications.filter((n) => n !== id),
                                  })
                                }
                              }}
                              className="rounded"
                            />
                            <label htmlFor={id} className="flex items-center gap-2 text-sm">
                              <Icon className="h-4 w-4" />
                              {label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Button onClick={addRule} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Kural Ekle
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Bildirim Ayarları
                </CardTitle>
                <CardDescription>Genel bildirim tercihlerinizi yönetin</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">E-posta Bildirimleri</h4>
                      <p className="text-sm text-gray-600">Uyarıları e-posta ile alın</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">Push Bildirimleri</h4>
                      <p className="text-sm text-gray-600">Tarayıcı bildirimleri</p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">SMS Bildirimleri</h4>
                      <p className="text-sm text-gray-600">Acil durumlar için SMS</p>
                    </div>
                    <Switch />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">İletişim Bilgileri</h4>

                  <div>
                    <Label htmlFor="email">E-posta Adresi</Label>
                    <Input id="email" type="email" placeholder="ornek@email.com" defaultValue="kullanici@example.com" />
                  </div>

                  <div>
                    <Label htmlFor="phone">Telefon Numarası</Label>
                    <Input id="phone" type="tel" placeholder="+90 5XX XXX XX XX" defaultValue="+90 532 123 45 67" />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Bildirim Zamanlaması</h4>

                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-medium">Sessiz Saatler</h5>
                      <p className="text-sm text-gray-600">Bu saatlerde bildirim almayın</p>
                    </div>
                    <Switch />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="quiet-start">Başlangıç</Label>
                      <Input id="quiet-start" type="time" defaultValue="22:00" />
                    </div>
                    <div>
                      <Label htmlFor="quiet-end">Bitiş</Label>
                      <Input id="quiet-end" type="time" defaultValue="07:00" />
                    </div>
                  </div>
                </div>

                <Button className="w-full">Ayarları Kaydet</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Uyarı Geçmişi</CardTitle>
                <CardDescription>Son 30 günde gönderilen uyarılar</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    {
                      time: "2 saat önce",
                      type: "traffic",
                      message: "Alsancak bölgesinde yoğun trafik",
                      status: "delivered",
                    },
                    {
                      time: "5 saat önce",
                      type: "incident",
                      message: "Bornova Kavşağında trafik kazası",
                      status: "delivered",
                    },
                    {
                      time: "Dün 18:30",
                      type: "route",
                      message: "Alternatif rota ile 15 dakika tasarruf",
                      status: "delivered",
                    },
                    {
                      time: "Dün 08:15",
                      type: "traffic",
                      message: "Kordon yolunda tıkanıklık",
                      status: "failed",
                    },
                  ].map((alert, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getTypeIcon(alert.type)}
                        <div>
                          <p className="font-medium">{alert.message}</p>
                          <p className="text-sm text-gray-600">{alert.time}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={getTypeColor(alert.type)}>{getTypeText(alert.type)}</Badge>
                        <Badge variant={alert.status === "delivered" ? "default" : "destructive"}>
                          {alert.status === "delivered" ? "İletildi" : "Başarısız"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
