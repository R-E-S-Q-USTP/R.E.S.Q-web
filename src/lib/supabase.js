import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug: Log environment variables (remove in production)
console.log("🔧 Supabase URL:", supabaseUrl ? "✓ loaded" : "✗ missing");
console.log("🔧 Supabase Key:", supabaseAnonKey ? `✓ loaded (${supabaseAnonKey.substring(0, 20)}...)` : "✗ missing");

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Missing Supabase environment variables!");
  console.error("VITE_SUPABASE_URL:", supabaseUrl);
  console.error("VITE_SUPABASE_ANON_KEY:", supabaseAnonKey);
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
 * Direct REST API call to Supabase (bypasses JS client for reliability)
 * @param {string} endpoint - The REST endpoint (e.g., 'incidents?select=*')
 * @param {string} method - HTTP method (GET, POST, PATCH, DELETE)
 * @param {object} body - Request body for POST/PATCH
 * @returns {Promise<any>} - Response data
 */
export const supabaseRest = async (endpoint, method = 'GET', body = null) => {
  const url = `${supabaseUrl}/rest/v1/${endpoint}`;
  const options = {
    method,
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json',
      'Prefer': method === 'GET' ? 'return=representation' : 'return=representation'
    }
  };
  if (body && (method === 'POST' || method === 'PATCH')) {
    options.body = JSON.stringify(body);
  }
  
  const response = await fetch(url, options);
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Supabase REST error: ${response.status} - ${error}`);
  }
  return response.json();
};

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
