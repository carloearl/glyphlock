import { base44 } from '@/api/base44Client';

/**
 * Search Service - Wrapper around glyphbotWebSearch backend function
 */

export async function query(searchQuery, maxResults = 5, options = {}) {
  try {
    const response = await base44.functions.invoke('glyphbotWebSearch', {
      query: searchQuery,
      maxResults,
      deep: !!options.deep,
      // REV A §1a — premium synthesis pass only in Live/Audit mode
      synthesis: !!options.synthesis
    });
    return response.data;
  } catch (error) {
    console.error('[Search Service] Error:', error);
    return {
      success: false,
      error: error.message,
      results: [],
      summary: 'Search unavailable'
    };
  }
}

export async function getSummary(searchQuery) {
  const result = await query(searchQuery, 5);
  return result.summary || 'No results found';
}

export default { query, getSummary };