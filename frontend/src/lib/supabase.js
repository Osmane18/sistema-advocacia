import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Variaveis de ambiente do Supabase nao configuradas. Verifique o arquivo .env')
}

export const supabase = createClient(supabaseUrl, supabaseKey)
