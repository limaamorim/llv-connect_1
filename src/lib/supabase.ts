import { createClient } from '@supabase/supabase-js'
import { modoDemonstracao } from './modoDemonstracao'

// O cliente só é usado no modo real. Valores locais evitam erro de inicialização
// quando as variáveis de ambiente ainda não foram configuradas.
export const supabase = createClient(
  modoDemonstracao ? 'https://demo.invalid' : import.meta.env.VITE_SUPABASE_URL,
  modoDemonstracao ? 'chave-publica-demo' : import.meta.env.VITE_SUPABASE_ANON_KEY,
)
