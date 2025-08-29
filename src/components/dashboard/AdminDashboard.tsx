import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, TrendingUp, BarChart3, Globe, Zap, AlertCircle } from "lucide-react";
import { useRole } from "@/hooks/useRole";

interface AdminDashboardProps {
  onViewModeChange?: (mode: 'search') => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onViewModeChange }) => {
  const [selectedClient, setSelectedClient] = useState<string>("");
  const { isLoading } = useRole();

  const globalMetrics = [
    {
      title: "Total de Clientes",
      value: "24",
      change: "+3 este mês",
      icon: Users,
      color: "text-primary"
    },
    {
      title: "Projetos Ativos", 
      value: "67",
      change: "+12 este mês",
      icon: Globe,
      color: "text-accent"
    },
    {
      title: "Auditorias Realizadas",
      value: "1,234",
      change: "+45 esta semana",
      icon: BarChart3,
      color: "text-primary"
    },
    {
      title: "Taxa de Crescimento",
      value: "23%",
      change: "+5% vs mês anterior",
      icon: TrendingUp,
      color: "text-accent"
    }
  ];

  const recentClients = [
    { name: "Empresa ABC", projects: 3, status: "active", lastSeen: "2 horas" },
    { name: "Loja XYZ", projects: 1, status: "pending", lastSeen: "1 dia" },
    { name: "Blog 123", projects: 2, status: "active", lastSeen: "30 min" },
  ];

  const systemAlerts = [
    { type: "warning", message: "3 projetos precisam de auditoria", urgent: false },
    { type: "info", message: "Novo cliente aguardando onboarding", urgent: false },
    { type: "error", message: "Limite de API próximo do limite", urgent: true },
  ];

  if (isLoading) {
    return <div className="flex justify-center p-8">Carregando dashboard...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header com seletor de cliente */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard Administrativo</h1>
          <p className="text-muted-foreground mt-2">
            Visão geral dos clientes e métricas de negócio
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={selectedClient} onValueChange={setSelectedClient}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Ver cliente específico" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="abc">Empresa ABC</SelectItem>
              <SelectItem value="xyz">Loja XYZ</SelectItem>
              <SelectItem value="123">Blog 123</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => onViewModeChange?.('search')}>
            Nova Pesquisa
          </Button>
        </div>
      </div>

      {/* Métricas Globais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {globalMetrics.map((metric, index) => (
          <Card key={index} className="border-l-4 border-l-primary/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <metric.icon className={`h-5 w-5 ${metric.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{metric.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{metric.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Conteúdo Principal */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="clients">Clientes</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Gráfico de Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Performance Geral
                </CardTitle>
                <CardDescription>
                  Crescimento de posicionamento dos clientes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-center justify-center bg-muted/20 rounded">
                  <div className="text-center">
                    <TrendingUp className="h-8 w-8 text-primary mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Gráfico de performance</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Projetos */}
            <Card>
              <CardHeader>
                <CardTitle>Projetos de Destaque</CardTitle>
                <CardDescription>
                  Melhor performance este mês
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recentClients.map((client, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <p className="font-medium text-foreground">{client.name}</p>
                      <p className="text-sm text-muted-foreground">{client.projects} projetos</p>
                    </div>
                    <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                      {client.status === 'active' ? 'Ativo' : 'Pendente'}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="clients" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gestão de Clientes</CardTitle>
              <CardDescription>
                Todos os clientes e seus projetos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentClients.map((client, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{client.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {client.projects} projetos • Visto {client.lastSeen} atrás
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                        {client.status === 'active' ? 'Ativo' : 'Pendente'}
                      </Badge>
                      <Button variant="outline" size="sm">
                        Ver Projetos
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  Alertas do Sistema
                </CardTitle>
                <CardDescription>
                  Notificações que precisam de atenção
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {systemAlerts.map((alert, index) => (
                  <div key={index} className={`flex items-start gap-3 p-3 rounded-lg ${
                    alert.type === 'error' ? 'bg-destructive/10' : 
                    alert.type === 'warning' ? 'bg-yellow-500/10' : 'bg-primary/10'
                  }`}>
                    <AlertCircle className={`h-4 w-4 mt-0.5 ${
                      alert.type === 'error' ? 'text-destructive' :
                      alert.type === 'warning' ? 'text-yellow-500' : 'text-primary'
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-foreground">{alert.message}</p>
                      {alert.urgent && (
                        <Badge variant="destructive" className="mt-1 text-xs">Urgente</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-accent" />
                  Uso de Recursos
                </CardTitle>
                <CardDescription>
                  Consumo de APIs e recursos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">API Google</span>
                    <span className="font-medium">847/1000</span>
                  </div>
                  <div className="w-full bg-muted h-2 rounded-full">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '84.7%' }}></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Auditorias</span>
                    <span className="font-medium">234/500</span>
                  </div>
                  <div className="w-full bg-muted h-2 rounded-full">
                    <div className="bg-accent h-2 rounded-full" style={{ width: '46.8%' }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};