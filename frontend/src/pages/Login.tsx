import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useState } from "react"
import { useAuth } from "@/context/AuthContext" // Importe o seu contexto
import { useNavigate } from "react-router-dom"

export default function LoginPage() {
    const [email, setEmail] = useState("")
    const [senha, setsenha] = useState("")
    const [loading, setLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState("") // Crie um estado real para o erro

    const { signIn } = useAuth()
    const navigate = useNavigate()

    async function handleLogin(e: React.FormEvent) {

        e.preventDefault()
        setErrorMessage("") // Limpa erro anterior

        if (!email || !senha) {
            alert("Preencha todos os campos")
            return
        }

        try {
            setLoading(true)
            const response = await signIn({ email, senha })

            navigate("/dashboard")
        } catch (error: any) {
            console.error("DADOS DA RESPOSTA DO BACKEND:", error.response?.data);
            // Use o estado de erro em vez de throw new Error
            setErrorMessage("E-mail ou senha inválidos.");
        } finally {
            setLoading(false);
        }
    }


    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 px-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold text-center">Login</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        {/* Exibe o erro na tela se existir */}
                        {errorMessage && <p className="text-red-500 text-center text-sm">{errorMessage}</p>}

                        <div className="space-y-2">
                            <Label htmlFor="email">E-mail</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="nome@empresa.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="senha">Senha</Label>
                            <Input
                                id="senha"
                                type="password" // <--- CORRIGIDO: de 'senha' para 'password'
                                required
                                value={senha}
                                onChange={(e) => setsenha(e.target.value)}
                                disabled={loading}
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Autenticando..." : "Entrar"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}