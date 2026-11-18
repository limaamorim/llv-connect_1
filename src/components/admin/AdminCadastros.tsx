import { useEffect, useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import Aviso, { MensagemAviso } from './Aviso'
import type { Categoria, Marca, Modelo } from '../../types'
import { excluirRegistro, listarCategorias, listarMarcas, listarModelos, salvarRegistro } from '../../services/servicoProdutos'

// Tela simples de cadastro: "categorias" OU "marcas e modelos"
export default function AdminCadastros({ tipo }: { tipo: 'categorias' | 'modelos' }) {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [marcas, setMarcas] = useState<Marca[]>([])
  const [modelos, setModelos] = useState<Modelo[]>([])
  const [msg, setMsg] = useState<MensagemAviso | null>(null)
  const [nome, setNome] = useState('')
  const [universal, setUniversal] = useState(false)
  const [marcaId, setMarcaId] = useState('')
  const [nomeModelo, setNomeModelo] = useState('')

  const carregar = () => Promise.all([listarCategorias(), listarMarcas(), listarModelos()])
    .then(([c, ma, mo]) => { setCategorias(c); setMarcas(ma); setModelos(mo) }).catch(() => setMsg({ tipo: 'erro', texto: 'Erro ao carregar.' }))
  useEffect(() => { carregar() }, [])

  // Executa uma ação e mostra sucesso/erro
  async function executar(acao: () => Promise<void>, ok: string) {
    try { await acao(); setMsg({ tipo: 'ok', texto: ok }); await carregar() } catch (e) { setMsg({ tipo: 'erro', texto: (e as Error).message || 'Erro ao salvar.' }) }
  }
  const renomear = (tabela: 'categorias' | 'marcas' | 'modelos', item: { id: string; nome: string }) => {
    const novo = prompt('Novo nome:', item.nome)?.trim()
    if (novo) executar(() => salvarRegistro(tabela, { id: item.id, nome: novo }), 'Nome atualizado.')
  }
  const apagar = (tabela: 'categorias' | 'marcas' | 'modelos', id: string) => {
    if (confirm('Excluir este item?')) executar(() => excluirRegistro(tabela, id), 'Item excluído.')
  }
  const Acoes = ({ tabela, item }: { tabela: 'categorias' | 'marcas' | 'modelos'; item: { id: string; nome: string } }) => (
    <span className="flex gap-2">
      <button title="Renomear" onClick={() => renomear(tabela, item)}><Pencil size={16} /></button>
      <button title="Excluir" onClick={() => apagar(tabela, item.id)}><Trash2 size={16} className="text-red-600" /></button>
    </span>
  )

  if (tipo === 'categorias') return (
    <div className="max-w-xl space-y-4">
      <h1 className="text-xl font-bold">Categorias</h1><Aviso msg={msg} />
      <form className="flex flex-wrap items-end gap-2 rounded border border-slate-200 bg-white p-4" onSubmit={(e) => {
        e.preventDefault()
        if (nome.trim().length < 2) return setMsg({ tipo: 'erro', texto: 'Informe o nome da categoria.' })
        executar(() => salvarRegistro('categorias', { nome: nome.trim(), universal }), 'Categoria cadastrada.'); setNome(''); setUniversal(false)
      }}>
        <div className="flex-1"><label className="rotulo">Nova categoria</label><input className="campo" value={nome} onChange={(e) => setNome(e.target.value)} /></div>
        <label className="flex items-center gap-2 pb-2 text-sm"><input type="checkbox" checked={universal} onChange={(e) => setUniversal(e.target.checked)} /> Serve em qualquer celular</label>
        <button className="botao">Adicionar</button>
      </form>
      <ul className="divide-y rounded border border-slate-200 bg-white">
        {categorias.map((c) => (
          <li key={c.id} className="flex items-center justify-between p-3 text-sm">
            <span>{c.nome} {c.universal && <em className="text-xs text-slate-500">(universal)</em>}</span><Acoes tabela="categorias" item={c} />
          </li>
        ))}
      </ul>
    </div>
  )

  return (
    <div className="grid max-w-3xl gap-6 md:grid-cols-2">
      <div className="col-span-full"><h1 className="text-xl font-bold">Marcas e modelos</h1><Aviso msg={msg} /></div>
      <div className="space-y-3">
        <form className="flex items-end gap-2 rounded border border-slate-200 bg-white p-4" onSubmit={(e) => {
          e.preventDefault()
          if (nome.trim().length < 2) return setMsg({ tipo: 'erro', texto: 'Informe o nome da marca.' })
          executar(() => salvarRegistro('marcas', { nome: nome.trim() }), 'Marca cadastrada.'); setNome('')
        }}>
          <div className="flex-1"><label className="rotulo">Nova marca</label><input className="campo" value={nome} onChange={(e) => setNome(e.target.value)} /></div>
          <button className="botao">Adicionar</button>
        </form>
        <ul className="divide-y rounded border border-slate-200 bg-white">
          {marcas.map((m) => <li key={m.id} className="flex items-center justify-between p-3 text-sm">{m.nome}<Acoes tabela="marcas" item={m} /></li>)}
        </ul>
      </div>
      <div className="space-y-3">
        <form className="space-y-2 rounded border border-slate-200 bg-white p-4" onSubmit={(e) => {
          e.preventDefault()
          if (!marcaId || nomeModelo.trim().length < 2) return setMsg({ tipo: 'erro', texto: 'Escolha a marca e informe o modelo.' })
          executar(() => salvarRegistro('modelos', { marca_id: marcaId, nome: nomeModelo.trim() }), 'Modelo cadastrado.'); setNomeModelo('')
        }}>
          <label className="rotulo">Novo modelo</label>
          <select className="campo" value={marcaId} onChange={(e) => setMarcaId(e.target.value)}>
            <option value="">Marca...</option>{marcas.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
          </select>
          <div className="flex gap-2"><input className="campo" placeholder="Ex.: iPhone 15" value={nomeModelo} onChange={(e) => setNomeModelo(e.target.value)} /><button className="botao">Adicionar</button></div>
        </form>
        <ul className="divide-y rounded border border-slate-200 bg-white">
          {modelos.filter((m) => !marcaId || m.marca_id === marcaId).map((m) => (
            <li key={m.id} className="flex items-center justify-between p-3 text-sm"><span>{marcas.find((x) => x.id === m.marca_id)?.nome} {m.nome}</span><Acoes tabela="modelos" item={m} /></li>
          ))}
        </ul>
      </div>
    </div>
  )
}
