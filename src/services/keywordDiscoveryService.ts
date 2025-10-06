import { supabase } from '@/integrations/supabase/client';

export interface DiscoveryStats {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
  bySource: {
    competitor: number;
    related: number;
    semantic: number;
    gap: number;
  };
}

export const KeywordDiscoveryService = {
  /**
   * Trigger keyword discovery for a project
   */
  async discoverKeywords(
    projectId: string,
    sources?: Array<'competitors' | 'related' | 'semantic' | 'gap'>
  ): Promise<{ success: boolean; message: string; suggestionsCreated: number }> {
    try {
      const { data, error } = await supabase.functions.invoke('discover-keywords', {
        body: {
          project_id: projectId,
          sources
        }
      });

      if (error) throw error;

      return {
        success: true,
        message: data.message,
        suggestionsCreated: data.suggestions_created
      };
    } catch (error) {
      console.error('Error discovering keywords:', error);
      throw error;
    }
  },

  /**
   * Get discovery statistics for a project
   */
  async getDiscoveryStats(projectId: string): Promise<DiscoveryStats> {
    try {
      const { data: suggestions, error } = await supabase
        .from('keyword_suggestions')
        .select('status, source_type')
        .eq('project_id', projectId);

      if (error) throw error;

      const stats: DiscoveryStats = {
        total: suggestions?.length || 0,
        pending: 0,
        accepted: 0,
        rejected: 0,
        bySource: {
          competitor: 0,
          related: 0,
          semantic: 0,
          gap: 0
        }
      };

      suggestions?.forEach(s => {
        if (s.status === 'pending') stats.pending++;
        else if (s.status === 'accepted') stats.accepted++;
        else if (s.status === 'rejected') stats.rejected++;

        if (s.source_type in stats.bySource) {
          stats.bySource[s.source_type as keyof typeof stats.bySource]++;
        }
      });

      return stats;
    } catch (error) {
      console.error('Error fetching discovery stats:', error);
      throw error;
    }
  },

  /**
   * Bulk accept suggestions
   */
  async bulkAcceptSuggestions(suggestionIds: string[]): Promise<{ success: boolean; count: number }> {
    try {
      const { error } = await supabase
        .from('keyword_suggestions')
        .update({ status: 'accepted' })
        .in('id', suggestionIds);

      if (error) throw error;

      return { success: true, count: suggestionIds.length };
    } catch (error) {
      console.error('Error accepting suggestions:', error);
      throw error;
    }
  },

  /**
   * Bulk reject suggestions
   */
  async bulkRejectSuggestions(suggestionIds: string[]): Promise<{ success: boolean; count: number }> {
    try {
      const { error } = await supabase
        .from('keyword_suggestions')
        .update({ status: 'rejected' })
        .in('id', suggestionIds);

      if (error) throw error;

      return { success: true, count: suggestionIds.length };
    } catch (error) {
      console.error('Error rejecting suggestions:', error);
      throw error;
    }
  },

  /**
   * Accept suggestion and add to keyword tracking
   */
  async addSuggestionToTracking(suggestionId: string): Promise<{ success: boolean; keywordId: string }> {
    try {
      // Get suggestion details
      const { data: suggestion, error: fetchError } = await supabase
        .from('keyword_suggestions')
        .select('*')
        .eq('id', suggestionId)
        .single();

      if (fetchError) throw fetchError;

      // Add to keyword_rankings
      const { data: newKeyword, error: insertError } = await supabase
        .from('keyword_rankings')
        .insert({
          project_id: suggestion.project_id,
          keyword: suggestion.suggested_keyword,
          search_engine: 'google',
          location: 'brazil',
          device: 'desktop'
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Mark suggestion as accepted
      await supabase
        .from('keyword_suggestions')
        .update({ status: 'accepted' })
        .eq('id', suggestionId);

      return { success: true, keywordId: newKeyword.id };
    } catch (error) {
      console.error('Error adding suggestion to tracking:', error);
      throw error;
    }
  }
};
