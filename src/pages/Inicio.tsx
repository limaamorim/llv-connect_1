import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Instagram, MapPin, MessageCircle, Clock } from 'lucide-react'
import Cabecalho from '../components/Cabecalho'
import Rodape from '../components/Rodape'
import CartaoProduto from '../components/CartaoProduto'
import FiltroCelular, { ValoresFiltro } from '../components/FiltroCelular'
import { buscarProdutosPublicos, listarCategorias } from '../services/servicoProdutos'
import { loja } from '../lib/configuracaoLoja'
import type { Categoria, ProdutoPublico } from '../types'

// Página inicial: banner, categorias, busca por celular, destaques e contato
export default function Inicio() {
  const navegar = useNavigate()
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [destaques, setDestaques] = useState<ProdutoPublico[]>([])

  useEffect(() => {
    listarCategorias().then(setCategorias).catch(() => undefined)
    buscarProdutosPublicos({ limite: 8 }).then((p) => setDestaques(p.filter((x) => x.estoque > 0))).catch(() => undefined)
  }, [])

  // Leva para o catálogo já com os filtros escolhidos na URL
  function irParaCatalogo(v: ValoresFiltro) {
    const params = new URLSearchParams()
    Object.entries(v).forEach(([k, val]) => val && params.set(k, val))
    navegar(`/catalogo?${params.toString()}`)
  }

  return (
    <div>
      <Cabecalho />
      <section className="bg-marca text-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
          <h1 className="max-w-xl text-3xl font-bold sm:text-4xl">Acessórios para o seu celular, com atendimento direto pelo WhatsApp</h1>
          <p className="mt-3 max-w-lg text-white/80">Capinhas, películas, carregadores e muito mais. Encontre o que serve no seu aparelho.</p>
          <Link to="/catalogo" className="mt-6 inline-block rounded bg-white px-5 py-2.5 text-sm font-semibold text-marca">Ver catálogo</Link>
        </div>
      </section>

      <main className="mx-auto max-w-6xl space-y-12 px-4 py-10">
        <section>
          <h2 className="mb-4 text-xl font-bold">Categorias</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {categorias.map((c) => (
              <Link key={c.id} to={`/catalogo?categoria=${c.id}`} className="rounded border border-slate-200 bg-marca-clara p-4 text-center text-sm font-medium hover:border-marca">{c.nome}</Link>
            ))}
          </div>
        </section>

        <FiltroCelular aoBuscar={irParaCatalogo} />

        <section>
          <h2 className="mb-4 text-xl font-bold">Produtos em destaque</h2>
          {destaques.length === 0 ? <p className="text-sm text-slate-500">Nenhum produto cadastrado ainda.</p> : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">{destaques.map((p) => <CartaoProduto key={p.id} produto={p} />)}</div>
          )}
        </section>

        <section id="contato" className="rounded border border-slate-200 p-6">
          <h2 className="mb-4 text-xl font-bold">Contato</h2>
          <ul className="space-y-3 text-sm">
            <li><a className="flex items-center gap-2 hover:text-marca" href={`https://wa.me/${loja.whatsapp}`} target="_blank" rel="noreferrer"><MessageCircle size={18} /> WhatsApp</a></li>
            <li><a className="flex items-center gap-2 hover:text-marca" href={`https://instagram.com/${loja.instagram}`} target="_blank" rel="noreferrer"><Instagram size={18} /> @{loja.instagram}</a></li>
            <li><a className="flex items-center gap-2 hover:text-marca" href={`https://www.google.com/maps/search/${encodeURIComponent(loja.endereco)}`} target="_blank" rel="noreferrer"><MapPin size={18} /> {loja.endereco}</a></li>
            <li className="flex items-center gap-2"><Clock size={18} /> {loja.horario}</li>
          </ul>
        </section>
      </main>
      <Rodape />
    </div>
  )
}
