import { createContext, useState, ReactNode, useContext, useEffect } from "react"
import api from "../services/api"

interface AuthContextData {
    signIn: (credentials: { email: string; senha: string }) => Promise<void>
    signUp: (data: { nome: string; email: string; senha: string; perfil?: string }) => Promise<void>
    signOut: () => void
    user: any
    isAuthenticated: boolean
}

export const AuthContext = createContext({} as AuthContextData)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const recoveredUser = localStorage.getItem("@Pitang:user");
        const token = localStorage.getItem("@Pitang:token");

        if (recoveredUser && token) {
            setUser(JSON.parse(recoveredUser));
            api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        }

        setLoading(false);
    }, []);


    async function signIn({ email, senha }): Promise<void> {
        const response = await api.post("auth/login", { email, senha });
        const { token, user } = response.data;


        setUser(user);


        localStorage.setItem("@Reembolso:token", token);
        localStorage.setItem("@Reembolso:user", JSON.stringify(user));

        api.defaults.headers.authorization = `Bearer ${token}`;
    }

    async function signUp(data: { nome: string; email: string; senha: string; perfil?: string }) {
        const response = await api.post("auth/cadastro", data);
        const { token, user } = response.data;

        setUser(user);
        localStorage.setItem("@Reembolso:token", token);
        localStorage.setItem("@Reembolso:user", JSON.stringify(user));
        api.defaults.headers.authorization = `Bearer ${token}`;
    }

    function signOut() {
        setUser(null);
        localStorage.removeItem("@Reembolso:token");
        localStorage.removeItem("@Reembolso:user");
        delete api.defaults.headers.authorization;
    }

    const isAuthenticated = !!user;

    if (loading) return <div>Carregando...</div>;

    return (
        <AuthContext.Provider value={{ signIn, signUp, signOut, user, isAuthenticated }}>
            {children}

        </AuthContext.Provider>

    );
}
export const useAuth = () => useContext(AuthContext);