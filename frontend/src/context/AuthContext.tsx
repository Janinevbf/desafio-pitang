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
    async function signIn({ email, senha }: any) {
        const response = await api.post("/auth/login", { email, senha });
        const { token, user: userData } = response.data;

        localStorage.setItem("@Pitang:token", token);
        localStorage.setItem("@Pitang:user", JSON.stringify(userData)); // Salva o perfil

        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        setUser(userData);
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