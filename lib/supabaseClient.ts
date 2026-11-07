import { createClient } from '@supabase/supabase-js';

// Get credentials from environment or runtime settings
export function getSupabaseConfig() {
  if (typeof window !== 'undefined') {
    const customUrl = localStorage.getItem('aquaflow_supabase_url');
    const customKey = localStorage.getItem('aquaflow_supabase_key');
    if (customUrl && customKey) {
      return { url: customUrl, key: customKey, isConfigured: true };
    }
  }

  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const envKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (envUrl && envKey && !envUrl.includes('your-project')) {
    return { url: envUrl, key: envKey, isConfigured: true };
  }

  return { url: '', key: '', isConfigured: false };
}

export function createSupabaseClient() {
  const config = getSupabaseConfig();
  if (!config.isConfigured || !config.url || !config.key) {
    return null;
  }
  try {
    return createClient(config.url, config.key);
  } catch (err) {
    console.warn('Could not initialize Supabase client:', err);
    return null;
  }
}
