import { createClient } from '@supabase/supabase-js'

// The project URL (must be in quotes)
const SUPABASE_URL = 'https://qzpgigcwgudmijtrzmrl.supabase.co'

// The API Key (must be in quotes)
const SUPABASE_ANON_KEY = 'sb_publishable_Tdv8n-7UhNbjuo-71kxM_Q_c3mbcIK4'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
export const USER_ID = '00000000-0000-0000-0000-000000000001';