export interface Categoria { id: string; nome: string; universal: boolean }
export interface Marca { id: string; nome: string }
export interface Modelo { id: string; marca_id: string; nome: string }
// Produto como o cliente vê (sem preço de custo)
export interface ProdutoPublico {
  id: string; nome: string; descricao: string | null; categoria_id: string
  preco_venda: number; imagem_url: string | null; estoque: number; universal: boolean; modelos_ids: string[]
}
// Produto completo (somente painel admin)
export interface ProdutoAdmin {
  id: string; nome: string; descricao: string | null; categoria_id: string; preco_venda: number
  preco_custo: number; imagem_url: string | null; estoque: number; ativo: boolean
  produtos_modelos?: { modelo_id: string }[]
}
export interface ItemVenda { id: string; produto_id: string; quantidade: number; preco_venda: number; preco_custo: number; produtos?: { nome: string } }
export interface Venda { id: string; data: string; forma_pagamento: string; desconto: number; status: 'concluida' | 'cancelada'; itens_venda: ItemVenda[] }
