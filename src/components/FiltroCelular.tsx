import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import type { Categoria, Marca, Modelo } from '../types'
import { listarCategorias, listarMarcas, listarModelos } from '../services/servicoProdutos'

// Valores do filtro (também usados como parâmetros da URL do catálogo)
export interface ValoresFiltro { categoria: string; marca: string; modelo: string; q: string }
export const filtroVazio: ValoresFiltro = { categoria: '', marca: '', modelo: '', q: '' }

const normalizar = (t: string) => t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()

interface Props { inicial?: ValoresFiltro; aoBuscar: (v: ValoresFiltro) => void; titulo?: boolean }

// "Qual é o seu celular?": categoria -> marca -> modelo, ou pesquisa direta pelo nome do aparelho
export default function FiltroCelular({ inicial = filtroVazio, aoBuscar, titulo = true }: Props) {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [marcas, setMarcas] = useState<Marca[]>([])
  const [modelos, setModelos] = useState<Modelo[]>([])
  const [v, setV] = useState<ValoresFiltro>(inicial)
  const [pesquisa, setPesquisa] = useState('')

  useEffect(() => { setV(inicial) }, [inicial.categoria, inicial.marca, inicial.modelo, inicial.q]) // eslint-disable-line
  useEffect(() => {
    Promise.all([listarCategorias(), listarMarcas(), listarModelos()])
      .then(([c, ma, mo]) => { setCategorias(c); setMarcas(ma); setModelos(mo) })
      .catch(() => undefined)
  }, [])

  const modelosDaMarca = modelos.filter((m) => m.marca_id === v.marca)
  const nomeCompleto = (m: Modelo) => `${marcas.find((x) => x.id === m.marca_id)?.nome ?? ''} ${m.nome}`.trim()

  function enviar(e: React.FormEvent) {
    e.preventDefault()
    const texto = normalizar(pesquisa)
    if (texto) {
      // Procura um modelo cujo nome (com ou sem a marca) contenha o texto digitado
      const achados = modelos.filter((m) => normalizar(nomeCompleto(m)).includes(texto))
      const exato = achados.find((m) => normalizar(nomeCompleto(m)) === texto || normalizar(m.nome) === texto)
      const escolhido = exato ?? (achados.length === 1 ? achados[0] : undefined)
      if (escolhido) return aoBuscar({ ...v, marca: escolhido.marca_id, modelo: escolhido.id, q: '' })
      return aoBuscar({ ...v, marca: '', modelo: '', q: pesquisa.trim() }) // senão, busca pelo nome do produto
    }
    aoBuscar({ ...v, q: '' })
  }

  const ehUniversal = categorias.find((c) => c.id === v.categoria)?.universal
  return (
    <form onSubmit={enviar} className="rounded border border-slate-200 bg-white p-4 sm:p-6">
      {titulo && <h2 className="mb-4 text-xl font-bold">Qual é o seu celular?</h2>}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2 lg:col-span-4">
          <label className="rotulo">Pesquisar</label>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-3 text-slate-400" />
            <input className="campo pl-9" list="lista-modelos" value={pesquisa} onChange={(e) => setPesquisa(e.target.value)}
              placeholder="Ex.: iPhone 15, Galaxy S24, Redmi Note 13" />
            <datalist id="lista-modelos">{modelos.map((m) => <option key={m.id} value={nomeCompleto(m)} />)}</datalist>
          </div>
        </div>
        <div>
          <label className="rotulo">Categoria</label>
          <select className="campo" value={v.categoria} onChange={(e) => setV({ ...v, categoria: e.target.value })}>
            <option value="">Todas</option>
            {categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
          </select>
        </div>
        <div>
          <label className="rotulo">Marca</label>
          <select className="campo" value={v.marca} disabled={ehUniversal} onChange={(e) => setV({ ...v, marca: e.target.value, modelo: '' })}>
            <option value="">Todas</option>
            {marcas.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
          </select>
        </div>
        <div>
          <label className="rotulo">Modelo</label>
          <select className="campo" value={v.modelo} disabled={!v.marca || ehUniversal} onChange={(e) => setV({ ...v, modelo: e.target.value })}>
            <option value="">{v.marca ? 'Todos os modelos' : 'Escolha a marca'}</option>
            {modelosDaMarca.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
          </select>
        </div>
        <div className="flex items-end"><button type="submit" className="botao w-full">Ver produtos</button></div>
      </div>
      {ehUniversal && <p className="mt-2 text-xs text-slate-500">Esta categoria serve para qualquer celular, não precisa escolher o modelo.</p>}
    </form>
  )
}
