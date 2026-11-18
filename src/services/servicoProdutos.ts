import { modoDemonstracao } from '../lib/modoDemonstracao'
import * as demo from '../lib/dadosDemonstracao'
import { supabase } from '../lib/supabase'
import type { Categoria, Marca, Modelo, ProdutoAdmin, ProdutoPublico } from '../types'

// ---------- Dados usados nos filtros (leitura pública) ----------
export async function listarCategorias(): Promise<Categoria[]> {
  if (modoDemonstracao) return demo.listarCategoriasDemo()
  const { data, error } = await supabase.from('categorias').select('*').order('nome')
  if (error) throw error
  return data as Categoria[]
}
export async function listarMarcas(): Promise<Marca[]> {
  if (modoDemonstracao) return demo.listarMarcasDemo()
  const { data, error } = await supabase.from('marcas').select('*').order('nome')
  if (error) throw error
  return data as Marca[]
}
export async function listarModelos(): Promise<Modelo[]> {
  if (modoDemonstracao) return demo.listarModelosDemo()
  const { data, error } = await supabase.from('modelos').select('*').order('nome')
  if (error) throw error
  return data as Modelo[]
}

// ---------- Catálogo público (usa a view produtos_publicos, que não tem preço de custo) ----------
export interface FiltroCatalogo { busca?: string; categoriaId?: string; modelosIds?: string[]; limite?: number }

export async function buscarProdutosPublicos(f: FiltroCatalogo): Promise<ProdutoPublico[]> {
  if (modoDemonstracao) return demo.buscarProdutosPublicosDemo(f)
  let consulta = supabase.from('produtos_publicos').select('*').order('nome')
  if (f.categoriaId) consulta = consulta.eq('categoria_id', f.categoriaId)
  if (f.busca) consulta = consulta.ilike('nome', `%${f.busca}%`)
  // Com modelo/marca escolhido: mostra produtos compatíveis OU universais (carregador, cabo, fone...)
  if (f.modelosIds && f.modelosIds.length > 0) {
    consulta = consulta.or(`universal.eq.true,modelos_ids.ov.{${f.modelosIds.join(',')}}`)
  }
  if (f.limite) consulta = consulta.limit(f.limite)
  const { data, error } = await consulta
  if (error) throw error
  return data as ProdutoPublico[]
}

// ---------- Painel admin ----------
export async function listarProdutosAdmin(): Promise<ProdutoAdmin[]> {
  if (modoDemonstracao) return demo.listarProdutosAdminDemo()
  const { data, error } = await supabase.from('produtos').select('*, produtos_modelos(modelo_id)').order('nome')
  if (error) throw error
  return data as ProdutoAdmin[]
}

// Salva (cria ou edita) o produto e substitui a lista de modelos compatíveis
export async function salvarProduto(produto: Partial<ProdutoAdmin>, modelosIds: string[]): Promise<void> {
  if (modoDemonstracao) return demo.salvarProdutoDemo(produto, modelosIds)
  const { produtos_modelos, ...dados } = produto
  void produtos_modelos
  const { data, error } = await supabase.from('produtos').upsert(dados).select('id').single()
  if (error) throw error
  const id = data.id as string
  const { error: e1 } = await supabase.from('produtos_modelos').delete().eq('produto_id', id)
  if (e1) throw e1
  if (modelosIds.length > 0) {
    const { error: e2 } = await supabase.from('produtos_modelos').insert(modelosIds.map((m) => ({ produto_id: id, modelo_id: m })))
    if (e2) throw e2
  }
}
export async function excluirProduto(id: string): Promise<void> {
  if (modoDemonstracao) return demo.excluirProdutoDemo(id)
  const { error } = await supabase.from('produtos').delete().eq('id', id)
  if (error) throw new Error('Não foi possível excluir. Se o produto já tem vendas, desative-o em vez de excluir.')
}
export async function ajustarEstoque(id: string, novoEstoque: number): Promise<void> {
  if (modoDemonstracao) return demo.ajustarEstoqueDemo(id, novoEstoque)
  const { error } = await supabase.from('produtos').update({ estoque: Math.max(0, novoEstoque) }).eq('id', id)
  if (error) throw error
}
// Envia a imagem para o bucket "produtos" e devolve a URL pública
export async function enviarImagem(arquivo: File): Promise<string> {
  if (modoDemonstracao) return new Promise((resolve, reject) => {
    if (arquivo.size > 700_000) return reject(new Error('No modo demo, use uma imagem de até 700 KB.'))
    const leitor = new FileReader()
    leitor.onload = () => resolve(String(leitor.result))
    leitor.onerror = () => reject(new Error('Erro ao ler a imagem.'))
    leitor.readAsDataURL(arquivo)
  })
  const caminho = `${Date.now()}-${arquivo.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
  const { error } = await supabase.storage.from('produtos').upload(caminho, arquivo)
  if (error) throw error
  return supabase.storage.from('produtos').getPublicUrl(caminho).data.publicUrl
}

// Cadastros simples (categorias, marcas, modelos)
export async function salvarRegistro(tabela: 'categorias' | 'marcas' | 'modelos', dados: Record<string, unknown>) {
  if (modoDemonstracao) return demo.salvarRegistroDemo(tabela, dados)
  const { error } = await supabase.from(tabela).upsert(dados)
  if (error) throw error
}
export async function excluirRegistro(tabela: 'categorias' | 'marcas' | 'modelos', id: string) {
  if (modoDemonstracao) return demo.excluirRegistroDemo(tabela, id)
  const { error } = await supabase.from(tabela).delete().eq('id', id)
  if (error) throw new Error('Não foi possível excluir: há produtos ou modelos vinculados.')
}
