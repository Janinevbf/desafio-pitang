import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/Login";
import { ProtectedRoute } from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import ReembolsoForm from "./pages/ReembolsoForm";
import ReembolsoDetalhe from "./pages/ReembolsoDetalhe";

function App() {
  return (
    <Routes>
      {/* Rotas Públicas */}
      <Route path="/login" element={<LoginPage />} />

      {/* Rotas Privadas (Protegidas) */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/reembolsos/novo" element={<ReembolsoForm />} />
        <Route path="/reembolsos/editar/:id" element={<ReembolsoForm />} />
        <Route path="/reembolsos/detalhe/:id" element={<ReembolsoDetalhe />} />
      </Route>

      {/* Redirecionamento padrão */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<div>404 - Página não encontrada</div>} />
    </Routes>
  );
}

export default App;