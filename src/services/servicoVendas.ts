import { supabase } from '../lib/supabase'
import type { Venda } from '../types'

export async function listarVendas(): Promise<Venda[]> {
  const { data, error } = await supabase.from('vendas').select('*, itens_venda(*, produtos(nome))').order('data', { ascending: false }).order('criado_em', { ascending: false })
  if (error) throw error
  return data as Venda[]
}
// A função do banco registra a venda e desconta o estoque numa única transação
export async function registrarVenda(data: string, pagamento: string, desconto: number, itens: { produto_id: string; quantidade: number }[]) {
  const { error } = await supabase.rpc('registrar_venda', { p_data: data, p_pagamento: pagamento, p_desconto: desconto, p_itens: itens })
  if (error) throw new Error(error.message)
}
// Cancela e devolve o estoque (o banco impede cancelar duas vezes)
export async function cancelarVenda(id: string) {
  const { error } = await supabase.rpc('cancelar_venda', { p_id: id })
  if (error) throw new Error(error.message)
}
