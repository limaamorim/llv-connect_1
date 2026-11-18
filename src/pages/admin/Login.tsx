import { useState } from 'react'
import { supabase } from '../../lib/supabase'

// Tela de login do painel (Supabase Authentication)
export default function Login({ aviso }: { aviso?: string }) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState(aviso ?? '')
  const [enviando, setEnviando] = useState(false)

  async function entrar(e: React.FormEvent) {
    e.preventDefault()
    if (!email.includes('@') || senha.length < 6) return setErro('Informe um e-mail válido e a senha (mínimo 6 caracteres).')
    setEnviando(true); setErro('')
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
    if (error) setErro('E-mail ou senha incorretos.')
    setEnviando(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <form onSubmit={entrar} className="w-full max-w-sm space-y-4 rounded border border-slate-200 bg-white p-6">
        <h1 className="text-xl font-bold text-marca">Painel LLV Connect</h1>
        {erro && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{erro}</p>}
        <div><label className="rotulo">E-mail</label><input className="campo" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        <div><label className="rotulo">Senha</label><input className="campo" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} /></div>
        <button className="botao w-full" disabled={enviando}>{enviando ? 'Entrando...' : 'Entrar'}</button>
      </form>
    </div>
  )
}
