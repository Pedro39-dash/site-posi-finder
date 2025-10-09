import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { IntegrationService } from "@/services/integrationService";
import { toast } from "sonner";
import { Loader2, Check, ChevronsUpDown, Globe } from "lucide-react";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    loadProperties();
  }, [integrationId]);

  // Filter properties based on search term
  const filteredProperties = useMemo(() => {
    if (!searchTerm) return properties;
    return properties.filter(prop => 
      prop.siteUrl.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [properties, searchTerm]);

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

  const handlePropertySelect = (property: SearchConsoleProperty) => {
    setSelectedProperty(property.siteUrl);
    setSearchTerm("");
    setOpen(false);
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

  const selectedProp = properties.find(p => p.siteUrl === selectedProperty);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Globe className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">Selecione a propriedade do Search Console:</span>
      </div>

      <div className="flex items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-[400px] justify-between"
            >
              {selectedProperty || "Selecione uma propriedade..."}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[400px] p-0">
            <Command>
              <CommandInput 
                placeholder="Buscar propriedade..." 
                value={searchTerm}
                onValueChange={setSearchTerm}
              />
              <CommandList className="max-h-[300px]">
                <CommandEmpty>Nenhuma propriedade encontrada</CommandEmpty>
                <CommandGroup>
                  {filteredProperties.map((property) => (
                    <CommandItem
                      key={property.siteUrl}
                      value={property.siteUrl}
                      onSelect={() => handlePropertySelect(property)}
                      className="flex items-center justify-between gap-3 cursor-pointer"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        {selectedProperty === property.siteUrl && (
                          <Check className="h-4 w-4 text-primary flex-shrink-0" />
                        )}
                        <span className="truncate">{property.siteUrl}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs flex-shrink-0">
                        {property.permissionLevel}
                      </Badge>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        
        <Button 
          onClick={handleSave} 
          disabled={isSaving || !selectedProperty || selectedProperty === currentPropertyId}
          size="sm"
        >
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar
        </Button>
      </div>

      {selectedProp && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Permissão: {selectedProp.permissionLevel}</span>
        </div>
      )}

      {searchTerm && (
        <div className="text-xs text-muted-foreground">
          Mostrando {filteredProperties.length} de {properties.length} propriedades
        </div>
      )}
    </div>
  );
};

export default PropertySelector;
