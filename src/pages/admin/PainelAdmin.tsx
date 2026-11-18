import { useEffect, useState } from 'react'
import { BarChart3, Boxes, LogOut, Package, ReceiptText, Smartphone, Tags } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import Login from './Login'
import AdminDashboard from '../../components/admin/AdminDashboard'
import AdminProdutos from '../../components/admin/AdminProdutos'
import AdminCadastros from '../../components/admin/AdminCadastros'
import AdminEstoque from '../../components/admin/AdminEstoque'
import AdminVendas from '../../components/admin/AdminVendas'

const abas = [
  { id: 'dashboard', nome: 'Dashboard', icone: BarChart3 },
  { id: 'produtos', nome: 'Produtos', icone: Package },
  { id: 'categorias', nome: 'Categorias', icone: Tags },
  { id: 'modelos', nome: 'Marcas e modelos', icone: Smartphone },
  { id: 'estoque', nome: 'Estoque', icone: Boxes },
  { id: 'vendas', nome: 'Vendas', icone: ReceiptText },
]

// /admin: só entra quem fez login E está na tabela "admins"
export default function PainelAdmin() {
  const [estado, setEstado] = useState<'carregando' | 'sair' | 'negado' | 'ok'>('carregando')
  const [aba, setAba] = useState('dashboard')

  async function verificar() {
    const { data } = await supabase.auth.getSession()
    if (!data.session) return setEstado('sair')
    const { data: admin } = await supabase.rpc('is_admin')
    setEstado(admin ? 'ok' : 'negado')
  }
  useEffect(() => {
    verificar()
    const { data } = supabase.auth.onAuthStateChange(() => { verificar() })
    return () => data.subscription.unsubscribe()
  }, [])

  if (estado === 'carregando') return <p className="p-6 text-sm">Carregando...</p>
  if (estado === 'sair') return <Login />
  if (estado === 'negado') return <Login aviso="Este usuário não tem permissão de administrador." />

  return (
    <div className="min-h-screen bg-slate-50 md:flex">
      <aside className="border-b border-slate-200 bg-white md:w-56 md:border-b-0 md:border-r">
        <div className="p-4 font-bold text-marca">LLV Connect</div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-2 md:flex-col md:pb-0">
          {abas.map((a) => (
            <button key={a.id} onClick={() => setAba(a.id)}
              className={`flex items-center gap-2 whitespace-nowrap rounded px-3 py-2 text-sm ${aba === a.id ? 'bg-marca text-white' : 'hover:bg-slate-100'}`}>
              <a.icone size={16} /> {a.nome}
            </button>
          ))}
          <button onClick={() => supabase.auth.signOut()} className="flex items-center gap-2 whitespace-nowrap rounded px-3 py-2 text-sm hover:bg-slate-100 md:mt-4">
            <LogOut size={16} /> Sair
          </button>
        </nav>
      </aside>
      <main className="flex-1 p-4 sm:p-6">
        {aba === 'dashboard' && <AdminDashboard />}
        {aba === 'produtos' && <AdminProdutos />}
        {aba === 'categorias' && <AdminCadastros tipo="categorias" />}
        {aba === 'modelos' && <AdminCadastros tipo="modelos" />}
        {aba === 'estoque' && <AdminEstoque />}
        {aba === 'vendas' && <AdminVendas />}
      </main>
    </div>
  )
}
