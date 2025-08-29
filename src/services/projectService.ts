import { supabase } from '@/integrations/supabase/client';

export interface Project {
  id: string;
  user_id: string;
  name: string;
  domain: string;
  market_segment?: string;
  focus_keywords: string[];
  competitor_domains: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectData {
  name: string;
  domain: string;
  market_segment?: string;
  focus_keywords?: string[];
  competitor_domains?: string[];
}

export class ProjectService {
  // Get user's projects
  static async getUserProjects(): Promise<{ success: boolean; projects?: Project[]; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, projects: data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Get active project
  static async getActiveProject(): Promise<{ success: boolean; project?: Project; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows found"
        return { success: false, error: error.message };
      }

      return { success: true, project: data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Create new project
  static async createProject(projectData: CreateProjectData): Promise<{ success: boolean; project?: Project; error?: string }> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // If this is the first project, make it active
      const { projects } = await this.getUserProjects();
      const isFirstProject = !projects || projects.length === 0;

      const { data, error } = await supabase
        .from('projects')
        .insert([{
          ...projectData,
          user_id: user.id,
          focus_keywords: projectData.focus_keywords || [],
          competitor_domains: projectData.competitor_domains || [],
          is_active: isFirstProject
        }])
        .select('*')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, project: data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Update project
  static async updateProject(projectId: string, updates: Partial<Project>): Promise<{ success: boolean; project?: Project; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .update(updates)
        .eq('id', projectId)
        .select('*')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, project: data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Set active project
  static async setActiveProject(projectId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // First, deactivate all projects
      await supabase
        .from('projects')
        .update({ is_active: false })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all projects

      // Then, activate the selected project
      const { error } = await supabase
        .from('projects')
        .update({ is_active: true })
        .eq('id', projectId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Delete project
  static async deleteProject(projectId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Get project by ID
  static async getProject(projectId: string): Promise<{ success: boolean; project?: Project; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, project: data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Clean domain URL
  static cleanDomain(url: string): string {
    try {
      // Remove protocol if present
      let cleanUrl = url.replace(/^https?:\/\//, '');
      // Remove www if present
      cleanUrl = cleanUrl.replace(/^www\./, '');
      // Remove trailing slash
      cleanUrl = cleanUrl.replace(/\/$/, '');
      // Get just the domain part (remove path)
      cleanUrl = cleanUrl.split('/')[0];
      
      return cleanUrl;
    } catch (error) {
      return url;
    }
  }
}