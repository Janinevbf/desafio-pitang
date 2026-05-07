import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

export const ProtectedRoute = () => {
    const { isAuthenticated } = useAuth();

    // Se não estiver autenticado, redireciona para o login
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Se estiver, renderiza o conteúdo da rota (Outlet)
    return <Outlet />;
};