import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { RankingService, RankingAlert } from "@/services/rankingService";
import { Plus, AlertCircle, Bell, TrendingDown, TrendingUp } from "lucide-react";

interface RankingAlertsProps {
  alerts: RankingAlert[];
  projectId: string;
  onAlertsUpdate: () => void;
}

export const RankingAlerts = ({ alerts, projectId, onAlertsUpdate }: RankingAlertsProps) => {
  const { toast } = useToast();
  const [isAddingAlert, setIsAddingAlert] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [alertType, setAlertType] = useState<'position_drop' | 'position_gain' | 'new_ranking' | 'lost_ranking'>('position_drop');
  const [thresholdValue, setThresholdValue] = useState("");

  const handleAddAlert = async () => {
    if (!keyword.trim()) return;

    setIsAddingAlert(true);
    try {
      const result = await RankingService.createRankingAlert({
        projectId,
        keyword: keyword.trim(),
        alertType,
        thresholdValue: thresholdValue ? parseInt(thresholdValue) : undefined
      });

      if (result.success) {
        toast({
          title: "Alerta Criado",
          description: `Alerta para "${keyword}" foi configurado com sucesso`
        });
        setKeyword("");
        setThresholdValue("");
        onAlertsUpdate();
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao criar alerta",
        variant: "destructive"
      });
    } finally {
      setIsAddingAlert(false);
    }
  };

  const getAlertTypeIcon = (alertType: string) => {
    switch (alertType) {
      case 'position_drop': return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'position_gain': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'new_ranking': return <Bell className="h-4 w-4 text-blue-600" />;
      case 'lost_ranking': return <AlertCircle className="h-4 w-4 text-orange-600" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getAlertTypeLabel = (alertType: string) => {
    switch (alertType) {
      case 'position_drop': return 'Queda de Posição';
      case 'position_gain': return 'Melhoria de Posição';
      case 'new_ranking': return 'Nova Classificação';
      case 'lost_ranking': return 'Classificação Perdida';
      default: return alertType;
    }
  };

  const getAlertTypeColor = (alertType: string) => {
    switch (alertType) {
      case 'position_drop': return 'bg-red-100 text-red-800';
      case 'position_gain': return 'bg-green-100 text-green-800';
      case 'new_ranking': return 'bg-blue-100 text-blue-800';
      case 'lost_ranking': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Alertas de Ranking ({alerts.length})
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Alerta
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Alerta de Ranking</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Palavra-chave</label>
                    <Input
                      placeholder="Digite a palavra-chave para monitorar"
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Tipo de Alerta</label>
                    <Select value={alertType} onValueChange={(value: any) => setAlertType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="position_drop">Queda de Posição</SelectItem>
                        <SelectItem value="position_gain">Melhoria de Posição</SelectItem>
                        <SelectItem value="new_ranking">Nova Classificação</SelectItem>
                        <SelectItem value="lost_ranking">Classificação Perdida</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {(alertType === 'position_drop' || alertType === 'position_gain') && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Valor do Limite (posições)
                      </label>
                      <Input
                        type="number"
                        placeholder="Ex: 5"
                        value={thresholdValue}
                        onChange={(e) => setThresholdValue(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {alertType === 'position_drop' 
                          ? 'Alerta quando a posição cair mais que este valor'
                          : 'Alerta quando a posição melhorar mais que este valor'}
                      </p>
                    </div>
                  )}
                  
                  <Button 
                    onClick={handleAddAlert}
                    disabled={isAddingAlert || !keyword.trim()}
                    className="w-full"
                  >
                    {isAddingAlert ? "Criando..." : "Criar Alerta"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum Alerta Configurado</h3>
              <p className="text-muted-foreground mb-4">
                Configure alertas para ser notificado sobre mudanças importantes nas posições das suas keywords
              </p>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Primeiro Alerta
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Alerta de Ranking</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Palavra-chave</label>
                      <Input
                        placeholder="Digite a palavra-chave para monitorar"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium mb-2 block">Tipo de Alerta</label>
                      <Select value={alertType} onValueChange={(value: any) => setAlertType(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="position_drop">Queda de Posição</SelectItem>
                          <SelectItem value="position_gain">Melhoria de Posição</SelectItem>
                          <SelectItem value="new_ranking">Nova Classificação</SelectItem>
                          <SelectItem value="lost_ranking">Classificação Perdida</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {(alertType === 'position_drop' || alertType === 'position_gain') && (
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Valor do Limite (posições)
                        </label>
                        <Input
                          type="number"
                          placeholder="Ex: 5"
                          value={thresholdValue}
                          onChange={(e) => setThresholdValue(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {alertType === 'position_drop' 
                            ? 'Alerta quando a posição cair mais que este valor'
                            : 'Alerta quando a posição melhorar mais que este valor'}
                        </p>
                      </div>
                    )}
                    
                    <Button 
                      onClick={handleAddAlert}
                      disabled={isAddingAlert || !keyword.trim()}
                      className="w-full"
                    >
                      {isAddingAlert ? "Criando..." : "Criar Alerta"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {getAlertTypeIcon(alert.alert_type)}
                      <span className="font-medium">{alert.keyword}</span>
                      <Badge className={getAlertTypeColor(alert.alert_type)}>
                        {getAlertTypeLabel(alert.alert_type)}
                      </Badge>
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      {alert.threshold_value && (
                        <span>Limite: {alert.threshold_value} posições • </span>
                      )}
                      Criado: {new Date(alert.created_at).toLocaleDateString('pt-BR')}
                      {alert.last_triggered && (
                        <span> • Último trigger: {new Date(alert.last_triggered).toLocaleDateString('pt-BR')}</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={alert.is_active ? "default" : "secondary"}>
                      {alert.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};