import { createClient } from '@supabase/supabase-js'

const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL     || ''
const supabaseAnon    = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseService = process.env.SUPABASE_SERVICE_ROLE_KEY     || supabaseAnon

// Cliente público (usado no frontend)
export const supabase = createClient(supabaseUrl, supabaseAnon)

// Cliente admin com service role (usado apenas em API Routes - server side)
export const supabaseAdmin = createClient(supabaseUrl, supabaseService)
