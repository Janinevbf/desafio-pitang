import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save } from "lucide-react";

export default function ReembolsoForm() {
    const { id } = useParams(); // Para saber se é edição
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();


    console.log("Usuário logado?", isAuthenticated);
    console.log("Dados do usuário:", user);

    // Estados do formulário
    const [descricao, setDescricao] = useState("");
    const [valor, setValor] = useState("");
    const [dataDespesa, setDataDespesa] = useState("");
    const [categoriaId, setCategoriaId] = useState("");
    const [categorias, setCategorias] = useState([]);
    const [loading, setLoading] = useState(false);

    // Carrega categorias do backend
    useEffect(() => {
        console.log("Buscando categorias...");
        api.get("/categorias")
            .then(response => setCategorias(response.data))
            .catch(err => console.error("Erro ao carregar categorias", err));

        // Se houver ID, carrega dados para edição (opcional agora)
        if (id) {
            api.get(`/reembolsos/${id}`).then(res => {
                setDescricao(res.data.descricao);
                setValor(res.data.valor);
                setCategoriaId(res.data.categoriaId);
                // Formata data YYYY-MM-DD para o input
                setDataDespesa(new Date(res.data.dataDespesa).toISOString().split('T')[0]);
            });
        }
    }, [id]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);

        const dados = {
            nome: descricao, // Adicione esta linha para satisfazer o Zod do Backend
            descricao: descricao,
            valor: parseFloat(valor),
            dataDespesa: new Date(dataDespesa).toISOString(),
            categoriaId,
            solicitanteId: user.id
        };

        try {
            if (id) {
                await api.put(`/reembolsos/${id}`, dados);
            } else {
                await api.post("/reembolsos", dados);
            }
            navigate("/dashboard");
        } catch (err) {
            console.error("Erro ao salvar", err);
            alert("Erro ao salvar reembolso. Verifique os campos.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <Button
                variant="ghost"
                className="mb-4"
                onClick={() => navigate("/dashboard")}
            >
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>

            <Card>
                <CardHeader>
                    <CardTitle>{id ? "Editar Reembolso" : "Solicitar Novo Reembolso"}</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="descricao">Descrição da Despesa</Label>
                            <Input
                                id="descricao"
                                placeholder="Ex: Almoço com cliente, Uber para aeroporto..."
                                value={descricao}
                                onChange={(e) => setDescricao(e.target.value)}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="valor">Valor (R$)</Label>
                                <Input
                                    id="valor"
                                    type="number"
                                    step="0.01"
                                    placeholder="0,00"
                                    value={valor}
                                    onChange={(e) => setValor(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="data">Data da Despesa</Label>
                                <Input
                                    id="data"
                                    type="date"
                                    value={dataDespesa}
                                    onChange={(e) => setDataDespesa(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Categoria</Label>
                            <Select
                                onValueChange={setCategoriaId}
                                value={categoriaId}
                                required
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione uma categoria" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categorias.map((cat: any) => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                            {cat.nome}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? "Salvando..." : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    {id ? "Atualizar Solicitação" : "Enviar Solicitação"}
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}