import { createBrowserClient } from "@supabase/ssr";

// Create the Supabase client only once
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;
let initializationAttempts = 0;
const MAX_ATTEMPTS = 3;

export const createClient = () => {
  // If we already have a client and it's working, return it
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
    
    initializationAttempts++;
    
    supabaseClient = createBrowserClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
      auth: {
        persistSession: true,
        detectSessionInUrl: true,
      },
    });

    // Test the client by creating a test channel
    const testChannel = supabaseClient.channel('test');
    if (!testChannel) {
      throw new Error("Failed to create test channel");
    }

    return supabaseClient;
  } catch (error) {
    console.error("Failed to initialize Supabase client:", error);
    
    // Clear the client so we can try again
    supabaseClient = null;

    // If we haven't reached max attempts, try again after a delay
    if (initializationAttempts < MAX_ATTEMPTS) {
      setTimeout(createClient, 1000);
    }

    // Return a dummy client that won't break the app but won't work either
    return {
      channel: (name: string) => {
        console.warn(`Attempted to create channel '${name}' but Supabase client is not initialized`);
        return {
          on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
          subscribe: () => ({ unsubscribe: () => {} })
        };
      }
    } as unknown as ReturnType<typeof createBrowserClient>;
  }
};

// Initialize the client
export const supabase = createClient();