import { Link } from 'react-router-dom'
import { loja } from '../lib/configuracaoLoja'

// Cabeçalho com logo e navegação. Coloque sua logo em public/logo.png
export default function Cabecalho() {
  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo.png" alt={loja.nome} className="h-9 w-auto" onError={(e) => (e.currentTarget.style.display = 'none')} />
          <span className="text-lg font-bold text-marca">{loja.nome}</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium">
          <Link to="/" className="hover:text-marca">Início</Link>
          <Link to="/catalogo" className="hover:text-marca">Catálogo</Link>
          <a href="/#contato" className="hover:text-marca">Contato</a>
        </nav>
      </div>
    </header>
  )
}
