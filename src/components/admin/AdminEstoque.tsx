import { useEffect, useState } from 'react'
import Aviso, { MensagemAviso } from './Aviso'
import { ajustarEstoque, listarProdutosAdmin } from '../../services/servicoProdutos'
import type { ProdutoAdmin } from '../../types'

// Estoque: digite uma quantidade para somar (ex.: 10) ou subtrair (ex.: -2)
export default function AdminEstoque() {
  const [produtos, setProdutos] = useState<ProdutoAdmin[]>([])
  const [valores, setValores] = useState<Record<string, string>>({})
  const [msg, setMsg] = useState<MensagemAviso | null>(null)
  const carregar = () => listarProdutosAdmin().then(setProdutos).catch(() => setMsg({ tipo: 'erro', texto: 'Erro ao carregar.' }))
  useEffect(() => { carregar() }, [])

  async function aplicar(p: ProdutoAdmin) {
    const n = parseInt(valores[p.id] ?? '', 10)
    if (!n) return setMsg({ tipo: 'erro', texto: 'Digite um número diferente de zero.' })
    if (p.estoque + n < 0) return setMsg({ tipo: 'erro', texto: 'O estoque não pode ficar negativo.' })
    try { await ajustarEstoque(p.id, p.estoque + n); setValores({ ...valores, [p.id]: '' }); setMsg({ tipo: 'ok', texto: 'Estoque atualizado.' }); carregar() }
    catch { setMsg({ tipo: 'erro', texto: 'Erro ao atualizar o estoque.' }) }
  }
  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-xl font-bold">Estoque</h1><Aviso msg={msg} />
      <ul className="divide-y rounded border border-slate-200 bg-white">
        {produtos.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
            <span className="min-w-0 flex-1">{p.nome}</span>
            <b className={p.estoque <= 5 ? 'text-red-600' : ''}>{p.estoque} un.</b>
            <input type="number" className="campo !w-24" placeholder="+/-" value={valores[p.id] ?? ''} onChange={(e) => setValores({ ...valores, [p.id]: e.target.value })} />
            <button className="botao-claro" onClick={() => aplicar(p)}>Aplicar</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
