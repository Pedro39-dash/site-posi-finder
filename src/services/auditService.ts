import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export interface AuditResult {
  category: string;
  score: number;
  status: 'excellent' | 'good' | 'needs_improvement' | 'critical';
  issues: Array<{
    type: 'success' | 'warning' | 'error';
    message: string;
    priority: 'high' | 'medium' | 'low';
    recommendation?: string;
    metadata?: any;
  }>;
}

export interface AuditReport {
  id: string;
  url: string;
  overall_score: number;
  status: 'pending' | 'analyzing' | 'completed' | 'failed';
  created_at: string;
  completed_at?: string;
  categories?: AuditResult[];
  metadata?: { error?: string; technical_error?: string; [key: string]: any };
}

export class AuditService {
  static async startAudit(url: string, focusKeyword?: string): Promise<{ success: boolean; auditId?: string; error?: string }> {
    try {
      console.log(`🚀 Starting audit for: ${url}`);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('❌ User not authenticated');
        return { success: false, error: 'User not authenticated' };
      }

      console.log(`👤 User authenticated: ${user.id}`);

      const { data, error } = await supabase.functions.invoke('seo-audit', {
        body: {
          url: url,
          userId: user.id,
          focusKeyword: focusKeyword
        }
      });

      if (error) {
        console.error('❌ Error invoking seo-audit function:', error);
        return { success: false, error: error.message };
      }

      console.log('✅ Audit started successfully:', data);
      return { success: true, auditId: data.auditId };
    } catch (error) {
      console.error('❌ Unexpected error in startAudit:', error);
      return { success: false, error: 'Failed to start audit' };
    }
  }

  static async getAuditStatus(auditId: string): Promise<{ success: boolean; report?: AuditReport; error?: string }> {
    try {
      const { data: report, error: reportError } = await supabase
        .from('audit_reports')
        .select('*')
        .eq('id', auditId)
        .single();

      if (reportError) {
        console.error('Error fetching audit report:', reportError);
        return { success: false, error: reportError.message };
      }

      if (report.status === 'completed') {
        // Fetch categories and issues
        // Fetch categories and issues with proper JSONB handling for large data
        const { data: categories, error: categoriesError } = await supabase
          .from('audit_categories')
          .select(`
            id,
            category,
            score,
            status,
            audit_issues (
              id,
              type,
              message,
              priority,
              recommendation,
              metadata
            )
          `)
          .eq('audit_report_id', auditId);

        if (categoriesError) {
          console.error('Error fetching categories:', categoriesError);
          return { success: false, error: categoriesError.message };
        }

        const formattedCategories = categories?.map(category => ({
          category: category.category,
          score: category.score,
          status: category.status as 'excellent' | 'good' | 'needs_improvement' | 'critical',
          issues: (category.audit_issues || []).map((issue: any) => ({
            type: issue.type as 'success' | 'warning' | 'error',
            message: issue.message,
            priority: issue.priority as 'high' | 'medium' | 'low',
            recommendation: issue.recommendation,
            metadata: issue.metadata
          }))
        })) || [];

        return {
          success: true,
          report: {
            ...report,
            status: report.status as 'pending' | 'analyzing' | 'completed' | 'failed',
            metadata: report.metadata as { error?: string; technical_error?: string; [key: string]: any } | undefined,
            categories: formattedCategories
          }
        };
      }

      return { 
        success: true, 
        report: {
          ...report,
          status: report.status as 'pending' | 'analyzing' | 'completed' | 'failed',
          metadata: report.metadata as { error?: string; technical_error?: string; [key: string]: any } | undefined
        }
      };
    } catch (error) {
      console.error('Error in getAuditStatus:', error);
      return { success: false, error: 'Failed to get audit status' };
    }
  }

  static async getUserAudits(limit: number = 10): Promise<{ success: boolean; audits?: AuditReport[]; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data: audits, error } = await supabase
        .from('audit_reports')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching user audits:', error);
        return { success: false, error: error.message };
      }

      return { 
        success: true, 
        audits: (audits || []).map(audit => ({
          ...audit,
          status: audit.status as 'pending' | 'analyzing' | 'completed' | 'failed',
          metadata: audit.metadata as { error?: string; technical_error?: string; [key: string]: any } | undefined
        }))
      };
    } catch (error) {
      console.error('Error in getUserAudits:', error);
      return { success: false, error: 'Failed to get user audits' };
    }
  }

  static async deleteAudit(auditId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('audit_reports')
        .delete()
        .eq('id', auditId);

      if (error) {
        console.error('Error deleting audit:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in deleteAudit:', error);
      return { success: false, error: 'Failed to delete audit' };
    }
  }

  // Enhanced method to get audit with keywords from dedicated table
  static async getAuditWithKeywords(auditId: string): Promise<{ success: boolean; report?: AuditReport; error?: string }> {
    try {
      // Get the main audit data
      const auditResult = await this.getAuditStatus(auditId);
      if (!auditResult.success || !auditResult.report) {
        return auditResult;
      }

      // Fetch keywords from the dedicated table
      const { data: keywords, error: keywordsError } = await supabase
        .from('audit_keywords')
        .select('*')
        .eq('audit_report_id', auditId)
        .order('relevance_score', { ascending: false });

      if (keywordsError) {
        console.error('Error fetching keywords from dedicated table:', keywordsError);
        // Continue with normal audit data if keywords fail
        return auditResult;
      }

      // Enhance the audit report with dedicated keywords
      if (keywords && keywords.length > 0 && auditResult.report.categories) {
        console.log(`✅ Found ${keywords.length} keywords in dedicated table`);
        
        // Group keywords by category
        const keywordsByCategory = keywords.reduce((acc: Record<string, string[]>, kw: any) => {
          if (!acc[kw.category]) acc[kw.category] = [];
          acc[kw.category].push(kw.keyword);
          return acc;
        }, {});

        // Enhance categories with keywords from dedicated table
        auditResult.report.categories = auditResult.report.categories.map(category => {
          const dedicatedKeywords = keywordsByCategory[category.category] || [];
          
          // If we have keywords in the dedicated table, use them
          if (dedicatedKeywords.length > 0) {
            // Find an existing issue to hold the keywords or create a new one
            let keywordIssue = category.issues.find(issue => 
              issue.metadata?.keywords || issue.message.includes('prompts') || issue.message.includes('palavras-chave')
            );
            
            if (keywordIssue && keywordIssue.metadata) {
              // Replace truncated keywords with full keywords from dedicated table
              keywordIssue.metadata.keywords = dedicatedKeywords;
              console.log(`✅ Enhanced ${category.category} with ${dedicatedKeywords.length} keywords from dedicated table`);
            } else {
              // Create a new issue with the keywords
              category.issues.push({
                type: 'success',
                message: `${dedicatedKeywords.length} palavras-chave extraídas do conteúdo`,
                priority: 'medium',
                metadata: {
                  keywords: dedicatedKeywords,
                  source: 'dedicated_table'
                }
              });
              console.log(`✅ Added new keywords issue to ${category.category} with ${dedicatedKeywords.length} keywords`);
            }
          }
          
          return category;
        });
      }

      return auditResult;
    } catch (error) {
      console.error('Error in getAuditWithKeywords:', error);
      // Fallback to regular audit data
      return this.getAuditStatus(auditId);
    }
  }
}