import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { useAuth } from "@/context/AuthContext"

export default function CadastroPage() {
    const [nome, setNome] = useState("")
    const [email, setEmail] = useState("")
    const [senha, setSenha] = useState("")
    const [perfil, setPerfil] = useState<string>("COLABORADOR")
    const [loading, setLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState("")

    const { signUp } = useAuth()
    const navigate = useNavigate()

    async function handleCadastro(e: React.FormEvent) {
        e.preventDefault()
        setErrorMessage("")

        if (!nome || !email || !senha) {
            setErrorMessage("Preencha todos os campos obrigatórios")
            return
        }

        if (senha.length < 6) {
            setErrorMessage("A senha deve ter pelo menos 6 caracteres")
            return
        }

        try {
            setLoading(true)
            await signUp({
                nome: nome.trim(),
                email: email.trim(),
                senha,
                perfil: perfil as any,
            })
            navigate("/dashboard")
        } catch (error: any) {
            setErrorMessage(
                error.response?.data?.error ||
                error.response?.data?.mensagem ||
                "Erro ao realizar cadastro"
            )
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-orange-50 to-orange-100 px-4">
            <Card className="w-full max-w-md shadow-2xl border-t-4 border-t-orange-500">
                <CardHeader className="space-y-1">
                    <div className="flex justify-center mb-2">
                        <div className="h-12 w-12 rounded-full bg-orange-500 flex items-center justify-center shadow-md">
                            <span className="text-white font-bold text-xl">$</span>
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-center text-gray-800">
                        Criar Conta
                    </CardTitle>
                    <p className="text-sm text-center text-gray-500">
                        Preencha os dados para se cadastrar
                    </p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleCadastro} className="space-y-4">
                        {errorMessage && (
                            <div className="bg-red-50 border border-red-200 p-3 rounded-md">
                                <p className="text-red-600 text-center text-sm font-medium">
                                    {errorMessage}
                                </p>
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="nome" className="text-gray-700">Nome completo</Label>
                            <Input
                                id="nome"
                                type="text"
                                placeholder="Seu nome"
                                required
                                className="focus-visible:ring-orange-500 border-gray-300"
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-gray-700">E-mail</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="nome@empresa.com"
                                required
                                className="focus-visible:ring-orange-500 border-gray-300"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="perfil" className="text-gray-700">Perfil</Label>
                            <Select
                                value={perfil}
                                onValueChange={(value: string) => setPerfil(value)}
                            >
                                <SelectTrigger className="focus-visible:ring-orange-500 border-gray-300">
                                    <SelectValue placeholder="Selecione o perfil" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="COLABORADOR">Colaborador</SelectItem>
                                    <SelectItem value="GESTOR">Gestor</SelectItem>
                                    <SelectItem value="FINANCEIRO">Financeiro</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="senha" className="text-gray-700">Senha</Label>
                            <Input
                                id="senha"
                                type="password"
                                required
                                className="focus-visible:ring-orange-500 border-gray-300"
                                value={senha}
                                onChange={(e) => setSenha(e.target.value)}
                                disabled={loading}
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold transition-colors py-6"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                    Cadastrando...
                                </span>
                            ) : "Cadastrar"}
                        </Button>

                        <div className="text-center mt-4">
                            <Link to="/login" className="text-sm text-orange-600 hover:underline font-medium">
                                Já tem uma conta? Faça login
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
