// Mensagem de sucesso (verde) ou erro (vermelho)
export interface MensagemAviso { tipo: 'ok' | 'erro'; texto: string }
export default function Aviso({ msg }: { msg: MensagemAviso | null }) {
  if (!msg) return null
  const cor = msg.tipo === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
  return <p className={`mb-4 rounded p-3 text-sm ${cor}`}>{msg.texto}</p>
}
