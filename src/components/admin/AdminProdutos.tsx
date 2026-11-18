import { useEffect, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import Aviso, { MensagemAviso } from './Aviso'
import { enviarImagem, excluirProduto, listarCategorias, listarMarcas, listarModelos, listarProdutosAdmin, salvarProduto } from '../../services/servicoProdutos'
import { formatarMoeda } from '../../utils/formatarMoeda'
import type { Categoria, Marca, Modelo, ProdutoAdmin } from '../../types'

// Formulário usa texto nos números (para o usuário digitar à vontade) e converte ao salvar
interface Formulario {
  id?: string; nome: string; descricao: string; categoria_id: string; preco_venda: string; preco_custo: string
  estoque: string; ativo: boolean; imagem_url: string; modelos_ids: string[]
}
const formVazio: Formulario = { nome: '', descricao: '', categoria_id: '', preco_venda: '', preco_custo: '', estoque: '0', ativo: true, imagem_url: '', modelos_ids: [] }
const numero = (t: string) => parseFloat(t.replace(',', '.'))

export default function AdminProdutos() {
  const [produtos, setProdutos] = useState<ProdutoAdmin[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [marcas, setMarcas] = useState<Marca[]>([])
  const [modelos, setModelos] = useState<Modelo[]>([])
  const [form, setForm] = useState<Formulario | null>(null)
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [marcaVista, setMarcaVista] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState<MensagemAviso | null>(null)

  const carregar = () => Promise.all([listarProdutosAdmin(), listarCategorias(), listarMarcas(), listarModelos()])
    .then(([p, c, ma, mo]) => { setProdutos(p); setCategorias(c); setMarcas(ma); setModelos(mo) }).catch(() => setMsg({ tipo: 'erro', texto: 'Erro ao carregar.' }))
  useEffect(() => { carregar() }, [])

  function editar(p: ProdutoAdmin) {
    setForm({ id: p.id, nome: p.nome, descricao: p.descricao ?? '', categoria_id: p.categoria_id, preco_venda: String(p.preco_venda),
      preco_custo: String(p.preco_custo), estoque: String(p.estoque), ativo: p.ativo, imagem_url: p.imagem_url ?? '',
      modelos_ids: (p.produtos_modelos ?? []).map((x) => x.modelo_id) })
    setArquivo(null); setMsg(null)
  }
  const alternarModelo = (id: string) => form && setForm({ ...form, modelos_ids: form.modelos_ids.includes(id) ? form.modelos_ids.filter((m) => m !== id) : [...form.modelos_ids, id] })

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    if (!form) return
    // Validações
    if (form.nome.trim().length < 3) return setMsg({ tipo: 'erro', texto: 'Informe o nome do produto (mínimo 3 letras).' })
    if (!form.categoria_id) return setMsg({ tipo: 'erro', texto: 'Escolha a categoria.' })
    const venda = numero(form.preco_venda), custo = numero(form.preco_custo || '0'), estoque = parseInt(form.estoque, 10)
    if (isNaN(venda) || venda <= 0) return setMsg({ tipo: 'erro', texto: 'Preço de venda inválido.' })
    if (isNaN(custo) || custo < 0) return setMsg({ tipo: 'erro', texto: 'Preço de custo inválido.' })
    if (isNaN(estoque) || estoque < 0) return setMsg({ tipo: 'erro', texto: 'Estoque inválido.' })
    setSalvando(true)
    try {
      const imagem = arquivo ? await enviarImagem(arquivo) : form.imagem_url || null
      await salvarProduto({ id: form.id, nome: form.nome.trim(), descricao: form.descricao.trim() || null, categoria_id: form.categoria_id,
        preco_venda: venda, preco_custo: custo, estoque, ativo: form.ativo, imagem_url: imagem }, form.modelos_ids)
      setMsg({ tipo: 'ok', texto: 'Produto salvo com sucesso.' }); setForm(null); await carregar()
    } catch (err) { setMsg({ tipo: 'erro', texto: 'Erro ao salvar: ' + (err as Error).message }) }
    setSalvando(false)
  }
  async function alternarAtivo(p: ProdutoAdmin) {
    try { await salvarProduto({ id: p.id, nome: p.nome, categoria_id: p.categoria_id, preco_venda: p.preco_venda, preco_custo: p.preco_custo, estoque: p.estoque, ativo: !p.ativo }, (p.produtos_modelos ?? []).map((x) => x.modelo_id)); carregar() }
    catch { setMsg({ tipo: 'erro', texto: 'Erro ao alterar o status.' }) }
  }
  async function apagar(p: ProdutoAdmin) {
    if (!confirm(`Excluir "${p.nome}"?`)) return
    try { await excluirProduto(p.id); setMsg({ tipo: 'ok', texto: 'Produto excluído.' }); carregar() } catch (err) { setMsg({ tipo: 'erro', texto: (err as Error).message }) }
  }
  const set = (campo: keyof Formulario, valor: string | boolean) => form && setForm({ ...form, [campo]: valor })

  if (form) return (
    <form onSubmit={salvar} className="max-w-2xl space-y-4">
      <h1 className="text-xl font-bold">{form.id ? 'Editar produto' : 'Novo produto'}</h1><Aviso msg={msg} />
      <div><label className="rotulo">Nome *</label><input className="campo" value={form.nome} onChange={(e) => set('nome', e.target.value)} /></div>
      <div><label className="rotulo">Descrição</label><textarea className="campo" rows={3} value={form.descricao} onChange={(e) => set('descricao', e.target.value)} /></div>
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="sm:col-span-2"><label className="rotulo">Categoria *</label>
          <select className="campo" value={form.categoria_id} onChange={(e) => set('categoria_id', e.target.value)}><option value="">Escolha...</option>{categorias.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}</select></div>
        <div><label className="rotulo">Preço de venda *</label><input className="campo" inputMode="decimal" value={form.preco_venda} onChange={(e) => set('preco_venda', e.target.value)} /></div>
        <div><label className="rotulo">Preço de custo</label><input className="campo" inputMode="decimal" value={form.preco_custo} onChange={(e) => set('preco_custo', e.target.value)} /></div>
        <div><label className="rotulo">Estoque</label><input className="campo" type="number" min={0} value={form.estoque} onChange={(e) => set('estoque', e.target.value)} /></div>
      </div>
      <div><label className="rotulo">Imagem</label>
        {form.imagem_url && !arquivo && <img src={form.imagem_url} alt="" className="mb-2 h-20 rounded" />}
        <input type="file" accept="image/*" onChange={(e) => setArquivo(e.target.files?.[0] ?? null)} className="text-sm" /></div>
      <div>
        <label className="rotulo">Modelos compatíveis ({form.modelos_ids.length} selecionados) — deixe vazio para produtos universais</label>
        <select className="campo mb-2" value={marcaVista} onChange={(e) => setMarcaVista(e.target.value)}><option value="">Escolha uma marca para ver os modelos</option>{marcas.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}</select>
        <div className="grid grid-cols-2 gap-1 text-sm">
          {modelos.filter((m) => m.marca_id === marcaVista).map((m) => (
            <label key={m.id} className="flex items-center gap-2"><input type="checkbox" checked={form.modelos_ids.includes(m.id)} onChange={() => alternarModelo(m.id)} />{m.nome}</label>
          ))}
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.ativo} onChange={(e) => set('ativo', e.target.checked)} /> Produto ativo (visível no site)</label>
      <div className="flex gap-2"><button className="botao" disabled={salvando}>{salvando ? 'Salvando...' : 'Salvar'}</button><button type="button" className="botao-claro" onClick={() => setForm(null)}>Cancelar</button></div>
    </form>
  )

  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-xl font-bold">Produtos</h1>
        <button className="botao" onClick={() => { setForm({ ...formVazio }); setArquivo(null); setMsg(null) }}><Plus size={16} /> Novo produto</button></div>
      <Aviso msg={msg} />
      <ul className="divide-y rounded border border-slate-200 bg-white">
        {produtos.length === 0 && <li className="p-4 text-sm text-slate-500">Nenhum produto cadastrado.</li>}
        {produtos.map((p) => (
          <li key={p.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
            <div className="h-12 w-12 shrink-0 rounded bg-slate-100">{p.imagem_url && <img src={p.imagem_url} alt="" className="h-full w-full rounded object-cover" />}</div>
            <div className="min-w-0 flex-1"><p className="font-medium">{p.nome}</p><p className="text-xs text-slate-500">{categorias.find((c) => c.id === p.categoria_id)?.nome} · {formatarMoeda(p.preco_venda)} · estoque {p.estoque}</p></div>
            <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={p.ativo} onChange={() => alternarAtivo(p)} /> Ativo</label>
            <button title="Editar" onClick={() => editar(p)}><Pencil size={16} /></button>
            <button title="Excluir" onClick={() => apagar(p)}><Trash2 size={16} className="text-red-600" /></button>
          </li>
        ))}
      </ul>
    </div>
  )
}
