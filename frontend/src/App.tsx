import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/Login";
import CadastroPage from "./pages/Cadastro";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import ReembolsoForm from "./pages/ReembolsoForm";
import ReembolsoDetalhe from "./pages/ReembolsoDetalhe";
import CategoriasAdmin from "./pages/CategoriaAdmin";

function App() {
  return (
    <Routes>

      <Route path="/login" element={<LoginPage />} />
      <Route path="/cadastro" element={<CadastroPage />} />


      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/reembolsos/novo" element={<ReembolsoForm />} />
        <Route path="/reembolsos/editar/:id" element={<ReembolsoForm />} />
        <Route path="/reembolsos/detalhe/:id" element={<ReembolsoDetalhe />} />
        <Route path="/reembolsos/:id" element={<ReembolsoDetalhe />} />


        <Route path="/admin/categorias" element={<CategoriasAdmin />} />
      </Route>


      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<div>404 - Página não encontrada</div>} />
    </Routes>
  );
}

export default App;