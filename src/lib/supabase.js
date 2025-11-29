import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please check your .env file."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

/**
 * Wrap a Supabase query with a timeout to prevent infinite loading
 * @param {Promise} queryPromise - The Supabase query promise
 * @param {number} timeoutMs - Timeout in milliseconds (default 10 seconds)
 * @returns {Promise} - Resolves with query result or rejects on timeout
 */
export const fetchWithTimeout = async (queryPromise, timeoutMs = 10000) => {
  return Promise.race([
    queryPromise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Query timeout")), timeoutMs)
    ),
  ]);
};
