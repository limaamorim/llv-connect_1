import { useEffect, useState } from 'react'
import { Plus, X } from 'lucide-react'
import Aviso, { MensagemAviso } from './Aviso'
import { listarProdutosAdmin } from '../../services/servicoProdutos'
import { cancelarVenda, listarVendas, registrarVenda } from '../../services/servicoVendas'
import { formatarMoeda } from '../../utils/formatarMoeda'
import type { ProdutoAdmin, Venda } from '../../types'

const pagamentos = ['Pix', 'Dinheiro', 'Cartão de débito', 'Cartão de crédito']
interface LinhaItem { produto_id: string; quantidade: string }

export default function AdminVendas() {
  const [produtos, setProdutos] = useState<ProdutoAdmin[]>([])
  const [vendas, setVendas] = useState<Venda[]>([])
  const [itens, setItens] = useState<LinhaItem[]>([{ produto_id: '', quantidade: '1' }])
  const [data, setData] = useState(new Date().toISOString().slice(0, 10))
  const [pagamento, setPagamento] = useState(pagamentos[0])
  const [desconto, setDesconto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [msg, setMsg] = useState<MensagemAviso | null>(null)

  const carregar = () => Promise.all([listarProdutosAdmin(), listarVendas()]).then(([p, v]) => { setProdutos(p.filter((x) => x.ativo)); setVendas(v) })
    .catch(() => setMsg({ tipo: 'erro', texto: 'Erro ao carregar.' }))
  useEffect(() => { carregar() }, [])

  const atualizar = (i: number, campo: keyof LinhaItem, valor: string) => setItens(itens.map((l, n) => (n === i ? { ...l, [campo]: valor } : l)))
  // Total prévio (o preço final fica gravado pelo banco no momento da venda)
  const subtotal = itens.reduce((s, l) => s + (produtos.find((p) => p.id === l.produto_id)?.preco_venda ?? 0) * (parseInt(l.quantidade, 10) || 0), 0)
  const valorDesconto = parseFloat(desconto.replace(',', '.')) || 0

  async function concluir(e: React.FormEvent) {
    e.preventDefault()
    const lista = itens.map((l) => ({ produto_id: l.produto_id, quantidade: parseInt(l.quantidade, 10) }))
    if (lista.some((l) => !l.produto_id || !(l.quantidade > 0))) return setMsg({ tipo: 'erro', texto: 'Preencha produto e quantidade em todos os itens.' })
    if (valorDesconto < 0 || valorDesconto > subtotal) return setMsg({ tipo: 'erro', texto: 'Desconto inválido.' })
    setEnviando(true)
    try {
      await registrarVenda(data, pagamento, valorDesconto, lista)
      setMsg({ tipo: 'ok', texto: 'Venda registrada e estoque atualizado.' }); setItens([{ produto_id: '', quantidade: '1' }]); setDesconto(''); await carregar()
    } catch (err) { setMsg({ tipo: 'erro', texto: (err as Error).message }) }
    setEnviando(false)
  }
  async function cancelar(v: Venda) {
    if (!confirm('Cancelar esta venda e devolver os itens ao estoque?')) return
    try { await cancelarVenda(v.id); setMsg({ tipo: 'ok', texto: 'Venda cancelada e estoque devolvido.' }); await carregar() } catch (err) { setMsg({ tipo: 'erro', texto: (err as Error).message }) }
  }
  const totalVenda = (v: Venda) => v.itens_venda.reduce((s, i) => s + i.quantidade * Number(i.preco_venda), 0) - Number(v.desconto)

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-xl font-bold">Vendas</h1><Aviso msg={msg} />
      <form onSubmit={concluir} className="space-y-3 rounded border border-slate-200 bg-white p-4">
        <h2 className="font-semibold">Registrar venda</h2>
        {itens.map((l, i) => (
          <div key={i} className="flex gap-2">
            <select className="campo flex-1" value={l.produto_id} onChange={(e) => atualizar(i, 'produto_id', e.target.value)}>
              <option value="">Produto...</option>{produtos.map((p) => <option key={p.id} value={p.id}>{p.nome} — {formatarMoeda(p.preco_venda)} (estoque {p.estoque})</option>)}
            </select>
            <input className="campo !w-20" type="number" min={1} value={l.quantidade} onChange={(e) => atualizar(i, 'quantidade', e.target.value)} />
            {itens.length > 1 && <button type="button" onClick={() => setItens(itens.filter((_, n) => n !== i))}><X size={18} /></button>}
          </div>
        ))}
        <button type="button" className="botao-claro" onClick={() => setItens([...itens, { produto_id: '', quantidade: '1' }])}><Plus size={14} /> Adicionar item</button>
        <div className="grid gap-3 sm:grid-cols-3">
          <div><label className="rotulo">Data</label><input type="date" className="campo" value={data} onChange={(e) => setData(e.target.value)} /></div>
          <div><label className="rotulo">Pagamento</label><select className="campo" value={pagamento} onChange={(e) => setPagamento(e.target.value)}>{pagamentos.map((p) => <option key={p}>{p}</option>)}</select></div>
          <div><label className="rotulo">Desconto (R$)</label><input className="campo" inputMode="decimal" value={desconto} onChange={(e) => setDesconto(e.target.value)} /></div>
        </div>
        <p className="text-sm">Total: <b>{formatarMoeda(Math.max(0, subtotal - valorDesconto))}</b></p>
        <button className="botao" disabled={enviando}>{enviando ? 'Registrando...' : 'Concluir venda'}</button>
      </form>

      <div className="space-y-2">
        <h2 className="font-semibold">Histórico</h2>
        {vendas.length === 0 && <p className="text-sm text-slate-500">Nenhuma venda registrada.</p>}
        {vendas.map((v) => (
          <div key={v.id} className={`rounded border border-slate-200 bg-white p-3 text-sm ${v.status === 'cancelada' ? 'opacity-60' : ''}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span>{new Date(v.data + 'T00:00').toLocaleDateString('pt-BR')} · {v.forma_pagamento} {v.status === 'cancelada' && <b className="text-red-600">(cancelada)</b>}</span>
              <span className="flex items-center gap-3"><b>{formatarMoeda(totalVenda(v))}</b>
                {v.status === 'concluida' && <button className="botao-claro" onClick={() => cancelar(v)}>Cancelar venda</button>}</span>
            </div>
            <ul className="mt-1 text-xs text-slate-500">{v.itens_venda.map((i) => <li key={i.id}>{i.quantidade}x {i.produtos?.nome} — {formatarMoeda(i.preco_venda)}</li>)}
              {Number(v.desconto) > 0 && <li>Desconto: {formatarMoeda(v.desconto)}</li>}</ul>
          </div>
        ))}
      </div>
    </div>
  )
}
