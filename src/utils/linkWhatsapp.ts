import { loja } from '../lib/configuracaoLoja'
import { formatarMoeda } from './formatarMoeda'
// Monta o link do WhatsApp com mensagem automática (nome + preço do produto)
export function linkCompra(nome: string, preco: number): string {
  const texto = `Olá! Tenho interesse no produto: ${nome} (${formatarMoeda(preco)}). Ainda está disponível?`
  return `https://wa.me/${loja.whatsapp}?text=${encodeURIComponent(texto)}`
}
