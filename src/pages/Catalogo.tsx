import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import Cabecalho from '../components/Cabecalho'
import Rodape from '../components/Rodape'
import CartaoProduto from '../components/CartaoProduto'
import FiltroCelular, { ValoresFiltro } from '../components/FiltroCelular'
import { buscarProdutosPublicos, listarModelos } from '../services/servicoProdutos'
import type { Modelo, ProdutoPublico } from '../types'

// Catálogo: os filtros ficam na URL (?categoria=&marca=&modelo=&q=), então o link pode ser compartilhado
export default function Catalogo() {
  const [params, setParams] = useSearchParams()
  const [modelos, setModelos] = useState<Modelo[]>([])
  const [produtos, setProdutos] = useState<ProdutoPublico[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const filtro: ValoresFiltro = useMemo(() => ({
    categoria: params.get('categoria') ?? '', marca: params.get('marca') ?? '',
    modelo: params.get('modelo') ?? '', q: params.get('q') ?? '',
  }), [params])

  useEffect(() => { listarModelos().then(setModelos).catch(() => undefined) }, [])

  useEffect(() => {
    // Modelo escolhido -> só ele; só marca -> todos os modelos da marca
    const ids = filtro.modelo ? [filtro.modelo] : filtro.marca ? modelos.filter((m) => m.marca_id === filtro.marca).map((m) => m.id) : []
    if (filtro.marca && !filtro.modelo && modelos.length === 0) return // espera carregar os modelos
    setCarregando(true); setErro('')
    buscarProdutosPublicos({ categoriaId: filtro.categoria || undefined, busca: filtro.q || undefined, modelosIds: ids })
      .then(setProdutos).catch(() => setErro('Não foi possível carregar os produtos.')).finally(() => setCarregando(false))
  }, [filtro, modelos])

  function aplicar(v: ValoresFiltro) {
    const novos = new URLSearchParams()
    Object.entries(v).forEach(([k, val]) => val && novos.set(k, val))
    setParams(novos)
  }

  return (
    <div>
      <Cabecalho />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">
        <h1 className="text-2xl font-bold">Catálogo</h1>
        <FiltroCelular inicial={filtro} aoBuscar={aplicar} titulo={false} />
        {erro && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{erro}</p>}
        {carregando ? <p className="text-sm text-slate-500">Carregando...</p> : produtos.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhum produto encontrado para esses filtros.</p>
        ) : (
          <>
            <p className="text-sm text-slate-500">{produtos.length} produto(s)</p>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">{produtos.map((p) => <CartaoProduto key={p.id} produto={p} />)}</div>
          </>
        )}
      </main>
      <Rodape />
    </div>
  )
}
