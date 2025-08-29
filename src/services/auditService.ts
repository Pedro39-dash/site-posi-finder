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
}