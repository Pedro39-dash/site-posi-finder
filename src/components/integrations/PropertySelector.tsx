import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IntegrationService } from "@/services/integrationService";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface PropertySelectorProps {
  integrationId: string;
  currentPropertyId?: string | null;
  onPropertySaved: () => void;
}

interface SearchConsoleProperty {
  siteUrl: string;
  permissionLevel: string;
}

const PropertySelector = ({ integrationId, currentPropertyId, onPropertySaved }: PropertySelectorProps) => {
  const [properties, setProperties] = useState<SearchConsoleProperty[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>(currentPropertyId || "");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadProperties();
  }, [integrationId]);

  const loadProperties = async () => {
    setIsLoading(true);
    const result = await IntegrationService.listSearchConsoleProperties(integrationId);
    
    if (result.success && result.properties) {
      setProperties(result.properties);
      if (result.properties.length === 1 && !currentPropertyId) {
        setSelectedProperty(result.properties[0].siteUrl);
      }
    } else {
      toast.error('Erro ao carregar propriedades: ' + result.error);
    }
    
    setIsLoading(false);
  };

  const handleSave = async () => {
    if (!selectedProperty) {
      toast.error('Selecione uma propriedade');
      return;
    }

    setIsSaving(true);
    const result = await IntegrationService.saveSearchConsoleProperty(integrationId, selectedProperty);
    
    if (result.success) {
      toast.success('Propriedade salva com sucesso!');
      onPropertySaved();
    } else {
      toast.error('Erro ao salvar propriedade: ' + result.error);
    }
    
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando propriedades...
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        Nenhuma propriedade encontrada no Google Search Console
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={selectedProperty} onValueChange={setSelectedProperty}>
        <SelectTrigger className="w-[300px]">
          <SelectValue placeholder="Selecione uma propriedade" />
        </SelectTrigger>
        <SelectContent>
          {properties.map((prop) => (
            <SelectItem key={prop.siteUrl} value={prop.siteUrl}>
              {prop.siteUrl}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Button 
        onClick={handleSave} 
        disabled={isSaving || !selectedProperty || selectedProperty === currentPropertyId}
        size="sm"
      >
        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Salvar
      </Button>
    </div>
  );
};

export default PropertySelector;
