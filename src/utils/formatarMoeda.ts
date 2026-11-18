// Converte número em texto de moeda: 1234.5 -> "R$ 1.234,50"
export function formatarMoeda(valor: number): string {
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
