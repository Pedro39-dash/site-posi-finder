import { supabase } from '@/integrations/supabase/client';

export interface Profile {
  id: string;
  user_id: string;
  display_name?: string;
  email?: string;
  company_name?: string;
  market_segment?: string;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'client' | 'display';
  created_at: string;
}

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

export class UserService {
  // Profile management
  static async getProfile(): Promise<{ success: boolean; profile?: Profile; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, profile: data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async updateProfile(updates: Partial<Profile>): Promise<{ success: boolean; profile?: Profile; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select('*')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, profile: data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Role management
  static async getUserRoles(): Promise<{ success: boolean; roles?: UserRole[]; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, roles: data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async hasRole(role: 'admin' | 'client' | 'display'): Promise<boolean> {
    try {
      const { data } = await supabase
        .rpc('has_role', { 
          _user_id: (await supabase.auth.getUser()).data.user?.id,
          _role: role 
        });

      return Boolean(data);
    } catch (error) {
      console.error('Error checking role:', error);
      return false;
    }
  }

  static async addRole(role: 'admin' | 'client' | 'display'): Promise<{ success: boolean; error?: string }> {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { error } = await supabase
        .from('user_roles')
        .insert([{ user_id: user.id, role }]);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Admin functions
  static async getAllClients(): Promise<{ success: boolean; clients?: Profile[]; error?: string }> {
    try {
      const isAdmin = await this.hasRole('admin');
      if (!isAdmin) {
        return { success: false, error: 'Access denied' };
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, clients: data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  static async getClientProjects(clientId: string): Promise<{ success: boolean; projects?: Project[]; error?: string }> {
    try {
      const isAdmin = await this.hasRole('admin');
      if (!isAdmin) {
        return { success: false, error: 'Access denied' };
      }

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', clientId)
        .order('created_at', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, projects: data };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}