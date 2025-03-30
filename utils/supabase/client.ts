
import { createClient as createBrowserClient } from '@supabase/supabase-js'


const createClient = () =>
    createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
export const supabaseClient = createClient();