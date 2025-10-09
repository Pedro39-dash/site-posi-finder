import { supabase } from "@/integrations/supabase/client";

export interface ProjectIntegration {
  id: string;
  project_id: string;
  integration_type: 'search_console' | 'analytics';
  property_id?: string;
  view_id?: string;
  account_email?: string;
  connected_at: string;
  last_sync_at?: string;
  sync_status: 'active' | 'error' | 'expired' | 'disconnected';
  sync_error?: string;
  is_active: boolean;
}

export class IntegrationService {
  static async getProjectIntegrations(projectId: string) {
    const { data, error } = await supabase
      .from('project_integrations')
      .select('*')
      .eq('project_id', projectId);

    if (error) {
      console.error('Error fetching integrations:', error);
      return { success: false, error: error.message };
    }

    return { success: true, integrations: data as ProjectIntegration[] };
  }

  static async startOAuthFlow(projectId: string, integrationType: 'search_console' | 'analytics') {
    try {
      const { data, error } = await supabase.functions.invoke('google-oauth/authorize', {
        body: { 
          projectId, 
          integrationType,
          returnUrl: window.location.origin
        },
      });

      if (error) throw error;

      // Open OAuth window
      const width = 600;
      const height = 700;
      const left = window.screen.width / 2 - width / 2;
      const top = window.screen.height / 2 - height / 2;

      window.open(
        data.authUrl,
        'Google OAuth',
        `width=${width},height=${height},left=${left},top=${top}`
      );

      return { success: true };
    } catch (error: any) {
      console.error('Error starting OAuth:', error);
      return { success: false, error: error.message };
    }
  }

  static async disconnectIntegration(integrationId: string) {
    const { error } = await supabase
      .from('project_integrations')
      .update({ 
        is_active: false,
        sync_status: 'disconnected',
      })
      .eq('id', integrationId);

    if (error) {
      console.error('Error disconnecting integration:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  }

  static async syncIntegration(projectId: string, integrationType: 'search_console' | 'analytics') {
    try {
      const functionName = integrationType === 'search_console' 
        ? 'sync-search-console' 
        : 'sync-analytics';

      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { projectId },
      });

      if (error) throw error;

      return { success: true, data };
    } catch (error: any) {
      console.error('Error syncing integration:', error);
      return { success: false, error: error.message };
    }
  }

  static hasIntegration(integrations: ProjectIntegration[], type: 'search_console' | 'analytics'): boolean {
    return integrations?.some(
      int => int.integration_type === type && int.is_active && int.sync_status === 'active'
    ) || false;
  }

  static getIntegration(integrations: ProjectIntegration[], type: 'search_console' | 'analytics'): ProjectIntegration | undefined {
    return integrations?.find(
      int => int.integration_type === type && int.is_active
    );
  }
}
