import { createClient } from '@supabase/supabase-js'
// Cliente Supabase usando apenas a chave pública (anon). NUNCA use a service_role aqui.
export const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)
