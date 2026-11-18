import { useEffect, useState } from 'react'
import { listarVendas } from '../../services/servicoVendas'
import { listarProdutosAdmin } from '../../services/servicoProdutos'
import { formatarMoeda } from '../../utils/formatarMoeda'
import type { ProdutoAdmin } from '../../types'

const LIMITE_ESTOQUE_BAIXO = 5 // produtos com 5 ou menos unidades entram no alerta

export default function AdminDashboard() {
  const [faturamento, setFaturamento] = useState(0)
  const [lucro, setLucro] = useState(0)
  const [qtdVendas, setQtdVendas] = useState(0)
  const [porMes, setPorMes] = useState<{ mes: string; valor: number }[]>([])
  const [baixos, setBaixos] = useState<ProdutoAdmin[]>([])
  const [erro, setErro] = useState('')

  useEffect(() => {
    Promise.all([listarVendas(), listarProdutosAdmin()]).then(([vendas, produtos]) => {
      // Só vendas concluídas entram nos cálculos
      const validas = vendas.filter((v) => v.status === 'concluida')
      let fat = 0, custo = 0
      const meses: Record<string, number> = {}
      validas.forEach((v) => {
        const bruto = v.itens_venda.reduce((s, i) => s + i.quantidade * Number(i.preco_venda), 0)
        const cst = v.itens_venda.reduce((s, i) => s + i.quantidade * Number(i.preco_custo), 0)
        const liquido = bruto - Number(v.desconto)
        fat += liquido; custo += cst
        const mes = v.data.slice(0, 7) // AAAA-MM
        meses[mes] = (meses[mes] ?? 0) + liquido
      })
      setFaturamento(fat); setLucro(fat - custo); setQtdVendas(validas.length)
      setPorMes(Object.keys(meses).sort().slice(-6).map((m) => ({ mes: m.slice(5) + '/' + m.slice(0, 4), valor: meses[m] })))
      setBaixos(produtos.filter((p) => p.ativo && p.estoque <= LIMITE_ESTOQUE_BAIXO))
    }).catch(() => setErro('Erro ao carregar o dashboard.'))
  }, [])

  const maior = Math.max(1, ...porMes.map((m) => m.valor))
  const cartoes = [['Faturamento', formatarMoeda(faturamento)], ['Lucro bruto', formatarMoeda(lucro)], ['Vendas realizadas', String(qtdVendas)]]
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Dashboard</h1>
      {erro && <p className="rounded bg-red-50 p-3 text-sm text-red-700">{erro}</p>}
      <div className="grid gap-3 sm:grid-cols-3">
        {cartoes.map(([t, v]) => <div key={t} className="rounded border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">{t}</p><p className="text-2xl font-bold">{v}</p></div>)}
      </div>
      <div className="rounded border border-slate-200 bg-white p-4">
        <h2 className="mb-3 font-semibold">Vendas por mês</h2>
        {porMes.length === 0 ? <p className="text-sm text-slate-500">Sem vendas ainda.</p> : (
          <div className="flex h-40 items-end gap-3">
            {porMes.map((m) => (
              <div key={m.mes} className="flex flex-1 flex-col items-center justify-end gap-1">
                <span className="text-[10px] text-slate-500">{formatarMoeda(m.valor)}</span>
                <div className="w-full rounded-t bg-marca" style={{ height: `${(m.valor / maior) * 100}px` }} />
                <span className="text-xs">{m.mes}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="rounded border border-slate-200 bg-white p-4">
        <h2 className="mb-3 font-semibold">Estoque baixo (até {LIMITE_ESTOQUE_BAIXO} un.)</h2>
        {baixos.length === 0 ? <p className="text-sm text-slate-500">Nenhum produto com estoque baixo.</p> : (
          <ul className="divide-y text-sm">{baixos.map((p) => <li key={p.id} className="flex justify-between py-2"><span>{p.nome}</span><b>{p.estoque}</b></li>)}</ul>
        )}
      </div>
    </div>
  )
}
