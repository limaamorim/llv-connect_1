import { Route, Routes } from 'react-router-dom'
import Inicio from './pages/Inicio'
import Catalogo from './pages/Catalogo'
import PainelAdmin from './pages/admin/PainelAdmin'

// Rotas do site: / (início), /catalogo (produtos) e /admin (painel protegido)
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Inicio />} />
      <Route path="/catalogo" element={<Catalogo />} />
      <Route path="/admin" element={<PainelAdmin />} />
      <Route path="*" element={<Inicio />} />
    </Routes>
  )
}
