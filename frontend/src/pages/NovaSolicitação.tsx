import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import multer from 'multer';

export default function NovaSolicitacao() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [categorias, setCategorias] = useState<any[]>([]);

    // Estados do Formulário
    const [descricao, setDescricao] = useState("");
    const [valor, setValor] = useState("");
    const [categoriaId, setCategoriaId] = useState("");
    const [dataDespesa, setDataDespesa] = useState("");
    const upload = multer();

    useEffect(() => {
        api.get("/categorias")
            .then(res => {
                const ativas = res.data.filter((c: any) => c.ativo);
                setCategorias(ativas);
            })
            .catch(err => console.error("Erro ao carregar categorias", err));
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();



        const valorNumerico = parseFloat(valor);
        if (isNaN(valorNumerico) || valorNumerico <= 0) {
            alert("O valor deve ser maior que zero.");
            return;
        }


        const hoje = new Date();
        hoje.setHours(23, 59, 59, 999);
        const dataEscolhida = new Date(dataDespesa);

        if (dataEscolhida > hoje) {
            alert("A data da despesa não pode ser futura.");
            return;
        }

        if (!categoriaId || !dataDespesa) {
            alert("Preencha todos os campos obrigatórios.");
            return;
        }

        try {
            setLoading(true);
            await api.post("/reembolsos", {
                descricao,
                valor: valorNumerico,
                categoriaId,
                dataDespesa,
            });

            alert("Solicitação criada com sucesso (Rascunho)!");
            navigate("/dashboard");
        } catch (error: any) {
            console.error(error);
            alert(error.response?.data?.message || "Erro ao criar solicitação.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Nova Solicitação de Reembolso</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Descrição / Nome da Despesa</Label>
                            <Input
                                placeholder="Ex: Almoço com cliente"
                                value={descricao}
                                onChange={(e) => setDescricao(e.target.value)}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Valor (R$)</Label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0,00"
                                    value={valor}
                                    onChange={(e) => setValor(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Data da Despesa</Label>
                                <Input
                                    type="date"
                                    value={dataDespesa}
                                    onChange={(e) => setDataDespesa(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Categoria</Label>
                            <Select onValueChange={setCategoriaId} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione uma categoria" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categorias.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                            {cat.nome}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => navigate("/dashboard")}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? "Salvando..." : "Salvar Rascunho"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}