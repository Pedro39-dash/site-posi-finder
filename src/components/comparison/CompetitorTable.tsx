import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Download, ExternalLink } from 'lucide-react';
import { CompetitorDomain, CompetitorKeyword } from '@/services/competitorAnalysisService';

interface CompetitorTableProps {
  competitors: CompetitorDomain[];
  keywords: CompetitorKeyword[];
  targetDomain: string;
}

const CompetitorTable: React.FC<CompetitorTableProps> = ({ 
  competitors, 
  keywords, 
  targetDomain 
}) => {
  // Calculate metrics for each competitor
  const competitorMetrics = competitors.map(competitor => {
    const cleanDomain = competitor.domain.replace(/^https?:\/\//, '').replace(/^www\./, '');
    
    // Find keywords where this competitor appears
    const competitorKeywords = keywords.filter(keyword => 
      keyword.competitor_positions?.some(pos => 
        pos.domain?.replace(/^https?:\/\//, '').replace(/^www\./, '') === cleanDomain
      )
    );
    
    // Count common keywords (where both target and competitor appear)
    const commonKeywords = competitorKeywords.filter(keyword => 
      keyword.target_domain_position && keyword.target_domain_position > 0
    ).length;
    
    // Count different keywords (where only competitor appears)
    const differentKeywords = competitorKeywords.filter(keyword => 
      !keyword.target_domain_position || keyword.target_domain_position === 0
    ).length;
    
    // Estimate traffic based on keywords and positions
    const estimatedTraffic = competitorKeywords.reduce((total, keyword) => {
      const position = keyword.competitor_positions?.find(pos => 
        pos.domain?.replace(/^https?:\/\//, '').replace(/^www\./, '') === cleanDomain
      )?.position || 100;
      
      const searchVolume = keyword.search_volume || 0;
      const ctr = position <= 3 ? 0.3 : position <= 10 ? 0.15 : 0.05;
      return total + (searchVolume * ctr);
    }, 0);
    
    // Simulate backlinks data
    const estimatedBacklinks = Math.floor(Math.random() * 50000) + 10000;
    
    return {
      domain: cleanDomain,
      commonKeywords,
      differentKeywords,
      estimatedTraffic: Math.round(estimatedTraffic),
      estimatedBacklinks
    };
  });

  // Add target domain to the table
  const targetMetrics = {
    domain: targetDomain.replace(/^https?:\/\//, '').replace(/^www\./, ''),
    commonKeywords: keywords.filter(k => k.target_domain_position && k.target_domain_position > 0).length,
    differentKeywords: 0, // Target domain doesn't have "different" keywords from itself
    estimatedTraffic: keywords.reduce((total, keyword) => {
      const position = keyword.target_domain_position || 100;
      const searchVolume = keyword.search_volume || 0;
      const ctr = position <= 3 ? 0.3 : position <= 10 ? 0.15 : 0.05;
      return total + (searchVolume * ctr);
    }, 0),
    estimatedBacklinks: Math.floor(Math.random() * 75000) + 25000
  };

  const allMetrics = [targetMetrics, ...competitorMetrics];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Concorrentes Rastreados</CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Concorrente
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Domínio</TableHead>
                <TableHead className="text-center">Palavras-chave Comuns</TableHead>
                <TableHead className="text-center">Diferentes</TableHead>
                <TableHead className="text-center">Tráfego Est.</TableHead>
                <TableHead className="text-center">Backlinks Est.</TableHead>
                <TableHead className="text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allMetrics.map((metrics, index) => (
                <TableRow key={metrics.domain}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: index === 0 ? '#8884d8' : ['#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'][index - 1] || '#d084d0' }}
                      />
                      <span className="font-medium">{metrics.domain}</span>
                      {index === 0 && (
                        <Badge variant="secondary" className="ml-2">
                          Seu Site
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="font-mono">
                      {metrics.commonKeywords}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="font-mono">
                      {metrics.differentKeywords}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-mono text-sm">
                      {metrics.estimatedTraffic.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-mono text-sm">
                      {metrics.estimatedBacklinks.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompetitorTable;