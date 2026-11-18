// Sem credenciais, o projeto inicia em modo de demonstração automaticamente.
// Para forçar o modo de demonstração mesmo com Supabase configurado: VITE_MODO_DEMO=true
export const modoDemonstracao = import.meta.env.VITE_MODO_DEMO === 'true' ||
  !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY
