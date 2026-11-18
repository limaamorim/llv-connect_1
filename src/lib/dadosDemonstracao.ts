import type { Categoria, Marca, Modelo, ProdutoAdmin, ProdutoPublico, Venda } from '../types'

// Dados fictícios guardados no navegador. Não existem contas ou vendas reais neste modo.
const CHAVE = 'llv-connect-demonstracao-v1'
type Produto = ProdutoAdmin & { produtos_modelos: { modelo_id: string }[] }
interface BancoDemo { categorias: Categoria[]; marcas: Marca[]; modelos: Modelo[]; produtos: Produto[]; vendas: Venda[] }
const id = () => crypto.randomUUID()
const imagem = (nome: string) => {
  const texto = nome.replace(/&/g, '&amp;').replace(/</g, '&lt;').slice(0, 38)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600"><rect width="600" height="600" fill="#f1f5f9"/><rect x="175" y="95" width="250" height="390" rx="38" fill="#1e293b"/><rect x="190" y="110" width="220" height="360" rx="26" fill="#cbd5e1"/><circle cx="300" cy="448" r="8" fill="#475569"/><text x="300" y="535" text-anchor="middle" font-family="Arial" font-size="23" fill="#334155">${texto}</text></svg>`
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)
}
function iniciar(): BancoDemo {
  const categorias: Categoria[] = [
    { id: 'capinhas', nome: 'Capinhas', universal: false },
    { id: 'peliculas', nome: 'Películas', universal: false },
    { id: 'carregadores', nome: 'Carregadores', universal: true },
    { id: 'cabos', nome: 'Cabos', universal: true },
    { id: 'fones', nome: 'Fones', universal: true },
  ]
  const marcas: Marca[] = [
    { id: 'apple', nome: 'Apple' }, { id: 'samsung', nome: 'Samsung' },
    { id: 'xiaomi', nome: 'Xiaomi' }, { id: 'motorola', nome: 'Motorola' },
  ]
  const modelos: Modelo[] = [
    { id: 'iphone12', marca_id: 'apple', nome: 'iPhone 12' },
    { id: 'iphone13', marca_id: 'apple', nome: 'iPhone 13' },
    { id: 'iphone15', marca_id: 'apple', nome: 'iPhone 15' },
    { id: 's24', marca_id: 'samsung', nome: 'Galaxy S24' },
    { id: 'a54', marca_id: 'samsung', nome: 'Galaxy A54' },
    { id: 'redmi13', marca_id: 'xiaomi', nome: 'Redmi Note 13' },
    { id: 'motog84', marca_id: 'motorola', nome: 'Moto G84' },
  ]
  const itens: [string,string,string,number,number,number,string[]][] = [
    ['p1', 'Capinha transparente iPhone 15', 'capinhas', 29.9, 9.5, 18, ['iphone15']],
    ['p2', 'Capinha silicone iPhone 12', 'capinhas', 34.9, 12, 9, ['iphone12']],
    ['p3', 'Capinha anti-impacto Galaxy S24', 'capinhas', 39.9, 14, 7, ['s24']],
    ['p4', 'Capinha Redmi Note 13', 'capinhas', 24.9, 8, 15, ['redmi13']],
    ['p5', 'Película 3D iPhone 13', 'peliculas', 19.9, 5, 20, ['iphone13']],
    ['p6', 'Película Galaxy A54', 'peliculas', 19.9, 5, 4, ['a54']],
    ['p7', 'Carregador rápido USB-C', 'carregadores', 59.9, 25, 12, []],
    ['p8', 'Cabo USB-C 1 metro', 'cabos', 24.9, 7, 22, []],
    ['p9', 'Fone de ouvido Bluetooth', 'fones', 89.9, 39, 6, []],
    ['p10', 'Capinha Moto G84', 'capinhas', 29.9, 10, 8, ['motog84']],
  ]
  const produtos: Produto[] = itens.map(([idProduto, nome, categoria_id, preco_venda, preco_custo, estoque, modelosIds]) => ({
    id: idProduto, nome, descricao: 'Produto de demonstração da LLV Connect.', categoria_id,
    preco_venda, preco_custo, estoque, ativo: true, imagem_url: imagem(nome),
    produtos_modelos: modelosIds.map((modelo_id) => ({ modelo_id })),
  }))
  return { categorias, marcas, modelos, produtos, vendas: [] }
}
function ler(): BancoDemo {
  try {
    const salvo = localStorage.getItem(CHAVE)
    if (salvo) return JSON.parse(salvo) as BancoDemo
  } catch { /* navegador sem armazenamento disponível */ }
  return iniciar()
}
function gravar(banco: BancoDemo) {
  localStorage.setItem(CHAVE, JSON.stringify(banco))
}
export function listarCategoriasDemo() { return ler().categorias.sort((a,b) => a.nome.localeCompare(b.nome)) }
export function listarMarcasDemo() { return ler().marcas.sort((a,b) => a.nome.localeCompare(b.nome)) }
export function listarModelosDemo() { return ler().modelos.sort((a,b) => a.nome.localeCompare(b.nome)) }
export function listarProdutosAdminDemo(): ProdutoAdmin[] { return ler().produtos.sort((a,b) => a.nome.localeCompare(b.nome)) }
export function buscarProdutosPublicosDemo(f: { busca?: string; categoriaId?: string; modelosIds?: string[]; limite?: number }): ProdutoPublico[] {
  const b = ler()
  const q = (f.busca || '').toLocaleLowerCase('pt-BR')
  let lista = b.produtos.filter((p) => p.ativo && (!f.categoriaId || p.categoria_id === f.categoriaId))
  if (q) lista = lista.filter((p) => p.nome.toLocaleLowerCase('pt-BR').includes(q))
  if (f.modelosIds?.length) lista = lista.filter((p) => b.categorias.find((c) => c.id === p.categoria_id)?.universal ||
    p.produtos_modelos.some((m) => f.modelosIds!.includes(m.modelo_id)))
  return lista.sort((a,b) => a.nome.localeCompare(b.nome)).slice(0, f.limite || undefined).map((p) => ({
    id: p.id, nome: p.nome, descricao: p.descricao, categoria_id: p.categoria_id,
    preco_venda: p.preco_venda, imagem_url: p.imagem_url, estoque: p.estoque,
    universal: !!b.categorias.find((c) => c.id === p.categoria_id)?.universal,
    modelos_ids: p.produtos_modelos.map((m) => m.modelo_id),
  }))
}
export function salvarProdutoDemo(dados: Partial<ProdutoAdmin>, modelosIds: string[]) {
  const b = ler()
  const antigo = b.produtos.find((p) => p.id === dados.id)
  const completo: Produto = {
    id: antigo?.id || id(), nome: dados.nome || antigo?.nome || '',
    descricao: dados.descricao ?? antigo?.descricao ?? null,
    categoria_id: dados.categoria_id || antigo?.categoria_id || '',
    preco_venda: dados.preco_venda ?? antigo?.preco_venda ?? 0,
    preco_custo: dados.preco_custo ?? antigo?.preco_custo ?? 0,
    estoque: dados.estoque ?? antigo?.estoque ?? 0,
    ativo: dados.ativo ?? antigo?.ativo ?? true,
    imagem_url: dados.imagem_url ?? antigo?.imagem_url ?? null,
    produtos_modelos: modelosIds.map((modelo_id) => ({ modelo_id })),
  }
  b.produtos = antigo ? b.produtos.map((p) => p.id === antigo.id ? completo : p) : [...b.produtos, completo]
  gravar(b)
}
export function excluirProdutoDemo(produtoId: string) {
  const b = ler()
  if (b.vendas.some((v) => v.itens_venda.some((i) => i.produto_id === produtoId))) throw new Error('Este produto possui vendas. Desative-o.')
  b.produtos = b.produtos.filter((p) => p.id !== produtoId)
  gravar(b)
}
export function ajustarEstoqueDemo(produtoId: string, quantidade: number) {
  const b = ler()
  const produto = b.produtos.find((p) => p.id === produtoId)
  if (!produto) throw new Error('Produto não encontrado')
  produto.estoque = Math.max(0, quantidade)
  gravar(b)
}
type Tabela = 'categorias' | 'marcas' | 'modelos'
export function salvarRegistroDemo(tabela: Tabela, dados: Record<string, unknown>) {
  const b = ler()
  const lista = b[tabela] as { id: string; nome: string; [campo: string]: unknown }[]
  const registro = { ...dados, id: (dados.id as string) || id() } as { id: string; nome: string }
  const indice = lista.findIndex((x) => x.id === registro.id)
  if (indice >= 0) lista[indice] = { ...lista[indice], ...registro }
  else lista.push(registro)
  gravar(b)
}
export function excluirRegistroDemo(tabela: Tabela, registroId: string) {
  const b = ler()
  if (tabela === 'categorias' && b.produtos.some((p) => p.categoria_id === registroId)) throw new Error('Categoria com produtos vinculados.')
  if (tabela === 'marcas' && b.modelos.some((m) => m.marca_id === registroId)) throw new Error('Marca com modelos vinculados.')
  if (tabela === 'modelos' && b.produtos.some((p) => p.produtos_modelos.some((m) => m.modelo_id === registroId))) throw new Error('Modelo vinculado a produtos.')
  if (tabela === 'categorias') b.categorias = b.categorias.filter((x) => x.id !== registroId)
  else if (tabela === 'marcas') b.marcas = b.marcas.filter((x) => x.id !== registroId)
  else b.modelos = b.modelos.filter((x) => x.id !== registroId)
  gravar(b)
}
export function listarVendasDemo() { return ler().vendas.sort((a,b) => b.data.localeCompare(a.data)) }
export function registrarVendaDemo(data: string, pagamento: string, desconto: number, itens: { produto_id: string; quantidade: number }[]) {
  const b = ler()
  if (!data || !itens.length || itens.some((i) => !Number.isInteger(i.quantidade) || i.quantidade < 1)) throw new Error('Venda inválida.')
  const totais = new Map<string, number>()
  for (const i of itens) totais.set(i.produto_id, (totais.get(i.produto_id) || 0) + i.quantidade)
  for (const [produtoId, quantidade] of totais) {
    const p = b.produtos.find((x) => x.id === produtoId)
    if (!p || p.estoque < quantidade) throw new Error('Produto sem estoque suficiente: ' + (p?.nome || produtoId))
  }
  const subtotal = itens.reduce((s,i) => s + i.quantidade * (b.produtos.find((p) => p.id === i.produto_id)?.preco_venda || 0), 0)
  if (!Number.isFinite(desconto) || desconto < 0 || desconto > subtotal) throw new Error('Desconto inválido.')
  const itens_venda = itens.map((i) => {
    const p = b.produtos.find((x) => x.id === i.produto_id)!
    return { id: id(), produto_id: p.id, quantidade: i.quantidade, preco_venda: p.preco_venda,
      preco_custo: p.preco_custo, produtos: { nome: p.nome } }
  })
  for (const [produtoId, quantidade] of totais) b.produtos.find((p) => p.id === produtoId)!.estoque -= quantidade
  b.vendas.push({ id: id(), data, forma_pagamento: pagamento, desconto, status: 'concluida', itens_venda })
  gravar(b)
}
export function cancelarVendaDemo(vendaId: string) {
  const b = ler()
  const venda = b.vendas.find((v) => v.id === vendaId)
  if (!venda || venda.status === 'cancelada') throw new Error('Venda já cancelada ou inexistente.')
  venda.status = 'cancelada'
  for (const i of venda.itens_venda) {
    const produto = b.produtos.find((p) => p.id === i.produto_id)
    if (produto) produto.estoque += i.quantidade
  }
  gravar(b)
}
export function restaurarDemonstracao() { localStorage.removeItem(CHAVE) }
