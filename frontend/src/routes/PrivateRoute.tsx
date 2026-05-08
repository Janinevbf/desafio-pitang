// src/routes/PrivateRoute.tsx
import { JSX, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

interface PrivateRouteProps {
    children: JSX.Element;
    roles?: string[];
}

export function PrivateRoute({ children, roles }: PrivateRouteProps) {
    const { user, isAuthenticated } = useContext(AuthContext);

    if (!isAuthenticated) return <Navigate to="/" />;

    if (roles && !roles.includes(user?.perfil || '')) {
        return <Navigate to="/dashboard" />;
    }


    return children;
}