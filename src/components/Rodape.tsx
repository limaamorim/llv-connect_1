import { loja } from '../lib/configuracaoLoja'
export default function Rodape() {
  return (
    <footer className="border-t border-slate-200 py-6 text-center text-sm text-slate-500">
      © {new Date().getFullYear()} {loja.nome}. Todos os direitos reservados.
    </footer>
  )
}
