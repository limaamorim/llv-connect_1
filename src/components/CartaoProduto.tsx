import { MessageCircle } from 'lucide-react'
import type { ProdutoPublico } from '../types'
import { formatarMoeda } from '../utils/formatarMoeda'
import { linkCompra } from '../utils/linkWhatsapp'

// Cartão de produto: foto, nome, preço e botão que abre o WhatsApp
export default function CartaoProduto({ produto }: { produto: ProdutoPublico }) {
  const semEstoque = produto.estoque <= 0
  return (
    <div className="flex flex-col overflow-hidden rounded border border-slate-200 bg-white">
      <div className="aspect-square bg-slate-100">
        {produto.imagem_url && <img src={produto.imagem_url} alt={produto.nome} className="h-full w-full object-cover" loading="lazy" />}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <h3 className="text-sm font-medium leading-tight">{produto.nome}</h3>
        <p className="text-lg font-bold text-marca">{formatarMoeda(produto.preco_venda)}</p>
        {semEstoque ? (
          <span className="mt-auto rounded bg-slate-100 py-2 text-center text-sm text-slate-500">Indisponível</span>
        ) : (
          <a href={linkCompra(produto.nome, produto.preco_venda)} target="_blank" rel="noreferrer" className="botao mt-auto">
            <MessageCircle size={16} /> Comprar no WhatsApp
          </a>
        )}
      </div>
    </div>
  )
}
