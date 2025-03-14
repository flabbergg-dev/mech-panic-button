import { createClient } from '@supabase/supabase-js';

// Validate environment variables
function validateEnv<T extends string | number>(
  value: string | undefined,
  name: string,
  type: 'string' | 'number' = 'string'
): T {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  if (type === 'number') {
    const num = Number(value);
    if (Number.isNaN(num)) {
      throw new Error(`Invalid number for environment variable: ${name}`);
    }
    return num as T;
  }
  return value as T;
}

// Get and validate Supabase configuration
const supabaseUrl = validateEnv<string>(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  'NEXT_PUBLIC_SUPABASE_URL'
);
const supabaseKey = validateEnv<string>(
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  'NEXT_PUBLIC_SUPABASE_ANON_KEY'
);

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);

// Export validation function for other environment variables
export { validateEnv };
