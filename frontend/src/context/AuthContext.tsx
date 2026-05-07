import { createContext, useState, ReactNode, useContext, useEffect } from "react"
import api from "../services/api"

interface AuthContextData {
    signIn: (credentials: { email: string; senha: string }) => Promise<void>
    user: any
    isAuthenticated: boolean
}

export const AuthContext = createContext({} as AuthContextData)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true); // Adicione um estado de loading

    useEffect(() => {
        const recoveredUser = localStorage.getItem("@Pitang:user");
        const token = localStorage.getItem("@Pitang:token");

        if (recoveredUser && token) {
            setUser(JSON.parse(recoveredUser));
            api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        }

        setLoading(false);
    }, []);

    // No signIn, salve também o usuário no localStorage
    async function signIn({ email, senha }): Promise<void> {
        const response = await api.post("auth/login", { email, senha });
        const { token, user } = response.data;

        // 1. IMPORTANTE: Atualizar o estado do React para a UI mudar na hora
        setUser(user);

        // 2. IMPORTANTE: Sobrescrever os dados antigos no Storage
        localStorage.setItem("@Reembolso:token", token);
        localStorage.setItem("@Reembolso:user", JSON.stringify(user));

        // 3. Configurar o cabeçalho para as próximas chamadas de API
        api.defaults.headers.authorization = `Bearer ${token}`;
    }

    const isAuthenticated = !!user;

    if (loading) return <div>Carregando...</div>;

    return (
        <AuthContext.Provider value={{ signIn, user, isAuthenticated }}>
            {children}
        </AuthContext.Provider>
    );
}
export const useAuth = () => useContext(AuthContext);