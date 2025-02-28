import { createBrowserClient } from "@supabase/ssr";

// Create the Supabase client only once
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;

export const createClient = () => {
  // If we already have a client, return it
  if (supabaseClient) {
    return supabaseClient;
  }
  
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("Supabase environment variables are missing");
      throw new Error("Supabase configuration is incomplete");
    }
    
    console.log("Initializing Supabase client");
    supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
    return supabaseClient;
  } catch (error) {
    console.error("Failed to initialize Supabase client:", error);
    // Return a dummy client that won't break the app but won't work either
    return {
      channel: () => ({
        on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
        subscribe: () => ({ unsubscribe: () => {} })
      })
    } as any;
  }
};

export const supabase = createClient();