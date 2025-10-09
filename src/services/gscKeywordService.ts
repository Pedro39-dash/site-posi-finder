import { supabase } from "@/integrations/supabase/client";

export interface GSCKeywordCandidate {
  keyword: string;
  position: number;
  impressions: number;
  clicks: number;
  ctr: number;
}

export class GSCKeywordService {
  /**
   * Fetch available keywords from GSC (not currently monitored)
   */
  static async fetchAvailableKeywords(
    projectId: string, 
    limit: number = 100
  ): Promise<{
    success: boolean;
    keywords: GSCKeywordCandidate[];
    excluded?: number;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase.functions.invoke(
        'import-gsc-keywords',
        {
          body: { projectId, limit },
        }
      );

      if (error) throw error;

      return {
        success: true,
        keywords: data.keywords as GSCKeywordCandidate[],
        excluded: data.excluded
      };
    } catch (error: any) {
      console.error('[GSCKeywordService] Error fetching keywords:', error);
      return { success: false, error: error.message, keywords: [] };
    }
  }

  /**
   * Import selected keywords with historical data
   */
  static async importKeywords(
    projectId: string,
    keywords: GSCKeywordCandidate[]
  ): Promise<{
    success: boolean;
    imported?: number;
    error?: string;
  }> {
    try {
      // 1. Create records in keyword_rankings
      const keywordRecords = keywords.map(kw => ({
        project_id: projectId,
        keyword: kw.keyword,
        current_position: kw.position,
        impressions: kw.impressions,
        clicks: kw.clicks,
        ctr: kw.ctr,
        search_engine: 'google',
        device: 'desktop',
        location: 'brazil',
        data_source: 'search_console',
        metadata: {
          imported_from_gsc: true,
          import_date: new Date().toISOString()
        }
      }));

      const { data: insertedKeywords, error: insertError } = await supabase
        .from('keyword_rankings')
        .insert(keywordRecords)
        .select();

      if (insertError) throw insertError;

      console.log(`[GSCKeywordService] Inserted ${insertedKeywords.length} keywords`);

      // 2. Trigger sync to populate historical data (via sync-search-console)
      const { error: syncError } = await supabase.functions.invoke(
        'sync-search-console',
        { body: { projectId } }
      );

      if (syncError) {
        console.error('[GSCKeywordService] Sync error:', syncError);
      }

      return {
        success: true,
        imported: insertedKeywords.length
      };
    } catch (error: any) {
      console.error('[GSCKeywordService] Import error:', error);
      return { success: false, error: error.message };
    }
  }
}
