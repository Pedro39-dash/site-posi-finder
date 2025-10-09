import { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { GSCKeywordService, GSCKeywordCandidate } from '@/services/gscKeywordService';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface GSCKeyword extends GSCKeywordCandidate {
  selected: boolean;
}

interface GSCKeywordImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  onImportComplete: () => void;
  autoSelectTop50?: boolean;
}

export function GSCKeywordImportModal({
  isOpen,
  onClose,
  projectId,
  onImportComplete,
  autoSelectTop50 = false,
}: GSCKeywordImportModalProps) {
  const [keywords, setKeywords] = useState<GSCKeyword[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'impressions' | 'position' | 'ctr'>('impressions');
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && projectId) {
      loadKeywords();
    }
  }, [isOpen, projectId]);

  const loadKeywords = async () => {
    setIsLoading(true);
    try {
      const result = await GSCKeywordService.fetchAvailableKeywords(projectId, 500);
      
      if (result.success) {
        const keywordsWithSelection = result.keywords.map((kw, idx) => ({
          ...kw,
          selected: autoSelectTop50 && idx < 50,
        }));
        setKeywords(keywordsWithSelection);
        
        if (result.keywords.length === 0) {
          toast({
            title: 'Nenhuma keyword nova encontrada',
            description: 'Todas as keywords do Search Console já estão sendo monitoradas.',
          });
        }
      } else {
        toast({
          title: 'Erro ao buscar keywords',
          description: result.error || 'Erro desconhecido',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('[GSCKeywordImportModal] Error:', error);
      toast({
        title: 'Erro ao buscar keywords',
        description: 'Não foi possível conectar ao Search Console',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAndSortedKeywords = useMemo(() => {
    let filtered = keywords;

    if (searchTerm) {
      filtered = filtered.filter(kw =>
        kw.keyword.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return [...filtered].sort((a, b) => {
      if (sortBy === 'impressions') return b.impressions - a.impressions;
      if (sortBy === 'position') return a.position - b.position;
      if (sortBy === 'ctr') return b.ctr - a.ctr;
      return 0;
    });
  }, [keywords, searchTerm, sortBy]);

  const selectedCount = keywords.filter(kw => kw.selected).length;
  const allSelected = keywords.length > 0 && selectedCount === keywords.length;

  const toggleKeyword = (keyword: string) => {
    setKeywords(prev =>
      prev.map(kw =>
        kw.keyword === keyword ? { ...kw, selected: !kw.selected } : kw
      )
    );
  };

  const toggleAll = () => {
    const newState = !allSelected;
    setKeywords(prev => prev.map(kw => ({ ...kw, selected: newState })));
  };

  const selectTop50 = () => {
    const top50Keywords = new Set(
      [...keywords]
        .sort((a, b) => b.impressions - a.impressions)
        .slice(0, 50)
        .map(kw => kw.keyword)
    );
    setKeywords(prev =>
      prev.map(kw => ({ ...kw, selected: top50Keywords.has(kw.keyword) }))
    );
  };

  const selectTop100 = () => {
    const top100Keywords = new Set(
      [...keywords]
        .sort((a, b) => b.impressions - a.impressions)
        .slice(0, 100)
        .map(kw => kw.keyword)
    );
    setKeywords(prev =>
      prev.map(kw => ({ ...kw, selected: top100Keywords.has(kw.keyword) }))
    );
  };

  const selectAll = () => {
    setKeywords(prev => prev.map(kw => ({ ...kw, selected: true })));
  };

  const deselectAll = () => {
    setKeywords(prev => prev.map(kw => ({ ...kw, selected: false })));
  };

  const handleImport = async () => {
    const selectedKeywords = keywords.filter(kw => kw.selected);
    
    if (selectedKeywords.length === 0) {
      toast({
        title: 'Nenhuma keyword selecionada',
        description: 'Selecione ao menos uma keyword para importar',
        variant: 'destructive',
      });
      return;
    }

    setIsImporting(true);
    try {
      const result = await GSCKeywordService.importKeywords(projectId, selectedKeywords);
      
      if (result.success) {
        toast({
          title: 'Keywords importadas com sucesso!',
          description: `${result.imported} keywords adicionadas. Histórico de 16 meses sendo processado...`,
        });
        onImportComplete();
      } else {
        toast({
          title: 'Erro ao importar keywords',
          description: result.error || 'Erro desconhecido',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('[GSCKeywordImportModal] Import error:', error);
      toast({
        title: 'Erro ao importar keywords',
        description: 'Ocorreu um erro ao processar a importação',
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  const getPositionVariant = (position: number) => {
    if (position <= 3) return 'default';
    if (position <= 10) return 'secondary';
    if (position <= 20) return 'outline';
    return 'destructive';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>📊 Importar Keywords do Search Console</DialogTitle>
          <DialogDescription>
            Selecione as palavras-chave que deseja monitorar. Histórico de 16 meses será importado automaticamente.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Buscando keywords do Search Console...</span>
          </div>
        ) : (
          <>
            {/* Filter Controls */}
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Pesquisar keywords..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="impressions">Impressões</SelectItem>
                  <SelectItem value="position">Posição</SelectItem>
                  <SelectItem value="ctr">CTR</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bulk Actions */}
            <div className="flex gap-2 mb-4">
              <Button variant="outline" size="sm" onClick={selectTop50}>
                Top 50
              </Button>
              <Button variant="outline" size="sm" onClick={selectTop100}>
                Top 100
              </Button>
              <Button variant="outline" size="sm" onClick={selectAll}>
                Todas ({keywords.length})
              </Button>
              <Button variant="outline" size="sm" onClick={deselectAll}>
                Desmarcar Todas
              </Button>
            </div>

            {/* Keywords Table */}
            <ScrollArea className="h-[400px] border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
                    </TableHead>
                    <TableHead>Keyword</TableHead>
                    <TableHead>Posição</TableHead>
                    <TableHead>Impressões</TableHead>
                    <TableHead>Cliques</TableHead>
                    <TableHead>CTR</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedKeywords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Nenhuma keyword encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAndSortedKeywords.map((kw, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Checkbox
                            checked={kw.selected}
                            onCheckedChange={() => toggleKeyword(kw.keyword)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{kw.keyword}</TableCell>
                        <TableCell>
                          <Badge variant={getPositionVariant(kw.position)}>
                            #{kw.position}
                          </Badge>
                        </TableCell>
                        <TableCell>{kw.impressions.toLocaleString()}</TableCell>
                        <TableCell>{kw.clicks}</TableCell>
                        <TableCell>{(kw.ctr * 100).toFixed(2)}%</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t">
              <span className="text-sm text-muted-foreground">
                {selectedCount} de {keywords.length} keywords selecionadas
              </span>
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose} disabled={isImporting}>
                  Cancelar
                </Button>
                <Button onClick={handleImport} disabled={selectedCount === 0 || isImporting}>
                  {isImporting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    `Importar ${selectedCount} Keywords`
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
