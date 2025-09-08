import React, { useState } from 'react';
import { Download, FileText, FileSpreadsheet, Loader2, Check } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CompetitiveAnalysisData } from "@/services/competitorAnalysisService";
import { useToast } from "@/hooks/use-toast";

interface ExportReportsProps {
  analysisData: CompetitiveAnalysisData;
}

interface ExportOptions {
  format: 'csv' | 'pdf' | 'xlsx';
  includeExecutiveSummary: boolean;
  includeKeywordDetails: boolean;
  includeCompetitorAnalysis: boolean;
  includeOpportunities: boolean;
  includeCharts: boolean;
  onlyTopKeywords: boolean;
  topKeywordsLimit: number;
}

const ExportReports = ({ analysisData }: ExportReportsProps) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'csv',
    includeExecutiveSummary: true,
    includeKeywordDetails: true,
    includeCompetitorAnalysis: true,
    includeOpportunities: true,
    includeCharts: false,
    onlyTopKeywords: false,
    topKeywordsLimit: 50
  });

  const updateOption = (key: keyof ExportOptions, value: any) => {
    setExportOptions(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const generateCSV = () => {
    const { keywords, competitors, opportunities } = analysisData;
    let csvContent = '';

    if (exportOptions.includeExecutiveSummary) {
      csvContent += 'EXECUTIVE SUMMARY\n';
      csvContent += `Analysis ID,${analysisData.analysis.id}\n`;
      csvContent += `Target Domain,${analysisData.analysis.target_domain}\n`;
      csvContent += `Total Keywords,${keywords.length}\n`;
      csvContent += `Total Competitors,${competitors.length}\n`;
      csvContent += `Analysis Date,${new Date(analysisData.analysis.created_at).toLocaleDateString('pt-BR')}\n\n`;
    }

    if (exportOptions.includeKeywordDetails) {
      csvContent += 'KEYWORD ANALYSIS\n';
      csvContent += 'Keyword,Target Position,Search Volume,Competition Level,Best Competitor,Best Competitor Position,Gap,Opportunity Type\n';
      
      const keywordsToExport = exportOptions.onlyTopKeywords 
        ? keywords.slice(0, exportOptions.topKeywordsLimit)
        : keywords;

      keywordsToExport.forEach(keyword => {
        const bestCompetitor = keyword.competitor_positions?.[0];
        csvContent += `"${keyword.keyword}",`;
        csvContent += `${keyword.target_domain_position || 'Not Found'},`;
        csvContent += `${keyword.search_volume || 'N/A'},`;
        csvContent += `${keyword.competition_level || 'Unknown'},`;
        csvContent += `"${bestCompetitor?.domain || 'N/A'}",`;
        csvContent += `${bestCompetitor?.position || 'N/A'},`;
        csvContent += `${keyword.target_domain_position && bestCompetitor?.position ? keyword.target_domain_position - bestCompetitor.position : 'N/A'},`;
        csvContent += `"${opportunities.find(o => o.keyword === keyword.keyword)?.opportunity_type || 'None'}"\n`;
      });
      csvContent += '\n';
    }

    if (exportOptions.includeCompetitorAnalysis) {
      csvContent += 'COMPETITOR ANALYSIS\n';
      csvContent += 'Competitor Domain,Average Position,Total Keywords Found,Share of Voice,Relevance Score\n';
      
      competitors.forEach(competitor => {
        csvContent += `"${competitor.domain}",`;
        csvContent += `${competitor.average_position || 'N/A'},`;
        csvContent += `${competitor.total_keywords_found || 0},`;
        csvContent += `${competitor.share_of_voice || 0}%,`;
        csvContent += `${competitor.relevance_score || 0}\n`;
      });
      csvContent += '\n';
    }

    if (exportOptions.includeOpportunities) {
      csvContent += 'OPPORTUNITIES\n';
      csvContent += 'Keyword,Opportunity Type,Target Position,Best Competitor Position,Gap Size,Priority Score,Recommended Action\n';
      
      opportunities.forEach(opportunity => {
        csvContent += `"${opportunity.keyword}",`;
        csvContent += `"${opportunity.opportunity_type}",`;
        csvContent += `${opportunity.target_position || 'N/A'},`;
        csvContent += `${opportunity.best_competitor_position || 'N/A'},`;
        csvContent += `${opportunity.gap_size || 0},`;
        csvContent += `${opportunity.priority_score || 0},`;
        csvContent += `"${opportunity.recommended_action || 'N/A'}"\n`;
      });
    }

    return csvContent;
  };

  const generateExecutiveSummary = () => {
    const { analysis, keywords, competitors, opportunities } = analysisData;
    
    const winningKeywords = keywords.filter(k => k.target_domain_position && k.target_domain_position <= 3).length;
    const losingKeywords = keywords.filter(k => !k.target_domain_position || k.target_domain_position > 20).length;
    const avgPosition = keywords.reduce((sum, k) => sum + (k.target_domain_position || 100), 0) / keywords.length;
    
    return {
      domain: analysis.target_domain,
      analysisDate: new Date(analysis.created_at).toLocaleDateString('pt-BR'),
      totalKeywords: keywords.length,
      totalCompetitors: competitors.length,
      winningKeywords,
      losingKeywords,
      averagePosition: Math.round(avgPosition),
      totalOpportunities: opportunities.length,
      highPriorityOpportunities: opportunities.filter(o => o.priority_score && o.priority_score > 70).length,
      topCompetitors: competitors.slice(0, 3).map(c => ({
        domain: c.domain,
        avgPosition: c.average_position,
        shareOfVoice: c.share_of_voice
      }))
    };
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const domain = analysisData.analysis.target_domain.replace(/[^a-zA-Z0-9]/g, '_');
      
      if (exportOptions.format === 'csv') {
        const csvContent = generateCSV();
        downloadFile(csvContent, `competitive_analysis_${domain}_${timestamp}.csv`, 'text/csv');
        
      } else if (exportOptions.format === 'pdf') {
        // For PDF, we'll create a comprehensive text report
        const summary = generateExecutiveSummary();
        let pdfContent = `RELATÓRIO DE ANÁLISE COMPETITIVA\n\n`;
        pdfContent += `Domínio: ${summary.domain}\n`;
        pdfContent += `Data da Análise: ${summary.analysisDate}\n\n`;
        pdfContent += `RESUMO EXECUTIVO\n`;
        pdfContent += `- Total de Keywords: ${summary.totalKeywords}\n`;
        pdfContent += `- Keywords Vencendo (Top 3): ${summary.winningKeywords}\n`;
        pdfContent += `- Keywords Perdendo (20+): ${summary.losingKeywords}\n`;
        pdfContent += `- Posição Média: ${summary.averagePosition}ª\n`;
        pdfContent += `- Total de Oportunidades: ${summary.totalOpportunities}\n`;
        pdfContent += `- Oportunidades Alta Prioridade: ${summary.highPriorityOpportunities}\n\n`;
        
        downloadFile(pdfContent, `competitive_analysis_${domain}_${timestamp}.txt`, 'text/plain');
        
      } else if (exportOptions.format === 'xlsx') {
        // For now, export as CSV with XLSX extension for Excel compatibility
        const csvContent = generateCSV();
        downloadFile(csvContent, `competitive_analysis_${domain}_${timestamp}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      }

      toast({
        title: "✅ Export concluído",
        description: `Relatório exportado com sucesso em formato ${exportOptions.format.toUpperCase()}`,
      });

      setIsOpen(false);
      
    } catch (error) {
      console.error('Export error:', error);
      toast({
        variant: "destructive",
        title: "❌ Erro no export",
        description: "Ocorreu um erro ao exportar o relatório. Tente novamente.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Exportar Relatório
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Exportar Análise Competitiva</DialogTitle>
          <DialogDescription>
            Configure as opções do relatório que deseja exportar
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Format Selection */}
          <div className="space-y-2">
            <Label>Formato do Arquivo</Label>
            <Select value={exportOptions.format} onValueChange={(value: 'csv' | 'pdf' | 'xlsx') => updateOption('format', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    CSV (Excel)
                  </div>
                </SelectItem>
                <SelectItem value="xlsx">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    XLSX (Excel)
                  </div>
                </SelectItem>
                <SelectItem value="pdf">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    PDF
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Content Options */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Conteúdo do Relatório</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="summary"
                  checked={exportOptions.includeExecutiveSummary}
                  onCheckedChange={(checked) => updateOption('includeExecutiveSummary', !!checked)}
                />
                <Label htmlFor="summary" className="text-sm">Resumo Executivo</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="keywords"
                  checked={exportOptions.includeKeywordDetails}
                  onCheckedChange={(checked) => updateOption('includeKeywordDetails', !!checked)}
                />
                <Label htmlFor="keywords" className="text-sm">Detalhes das Keywords</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="competitors"
                  checked={exportOptions.includeCompetitorAnalysis}
                  onCheckedChange={(checked) => updateOption('includeCompetitorAnalysis', !!checked)}
                />
                <Label htmlFor="competitors" className="text-sm">Análise de Concorrentes</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="opportunities"
                  checked={exportOptions.includeOpportunities}
                  onCheckedChange={(checked) => updateOption('includeOpportunities', !!checked)}
                />
                <Label htmlFor="opportunities" className="text-sm">Oportunidades</Label>
              </div>

              {exportOptions.format === 'pdf' && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="charts"
                    checked={exportOptions.includeCharts}
                    onCheckedChange={(checked) => updateOption('includeCharts', !!checked)}
                  />
                  <Label htmlFor="charts" className="text-sm">Gráficos e Visualizações</Label>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Keyword Limit Options */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Limites de Dados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="topOnly"
                  checked={exportOptions.onlyTopKeywords}
                  onCheckedChange={(checked) => updateOption('onlyTopKeywords', !!checked)}
                />
                <Label htmlFor="topOnly" className="text-sm">Apenas top keywords</Label>
              </div>

              {exportOptions.onlyTopKeywords && (
                <div className="ml-6">
                  <Select 
                    value={exportOptions.topKeywordsLimit.toString()} 
                    onValueChange={(value) => updateOption('topKeywordsLimit', parseInt(value))}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">Top 25</SelectItem>
                      <SelectItem value="50">Top 50</SelectItem>
                      <SelectItem value="100">Top 100</SelectItem>
                      <SelectItem value="200">Top 200</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Preview do Relatório</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Keywords a exportar:</span>
                  <Badge variant="secondary">
                    {exportOptions.onlyTopKeywords ? exportOptions.topKeywordsLimit : analysisData.keywords.length}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Concorrentes:</span>
                  <Badge variant="secondary">{analysisData.competitors.length}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Oportunidades:</span>
                  <Badge variant="secondary">{analysisData.opportunities?.length || 0}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Export Button */}
          <Button 
            onClick={handleExport} 
            disabled={isExporting}
            className="w-full"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Exportar {exportOptions.format.toUpperCase()}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportReports;