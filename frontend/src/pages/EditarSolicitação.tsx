import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EditarSolicitacao() {
    const { id } = useParams(); // Pega o ID da URL
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    const [descricao, setDescricao] = useState("");
    const [valor, setValor] = useState("");
    const [dataDespesa, setDataDespesa] = useState("");
    const [categoriaId, setCategoriaId] = useState("");

    useEffect(() => {
        async function loadData() {
            try {
                const response = await api.get(`/reembolsos/${id}`);
                const r = response.data;

                // TRAVA DE SEGURANÇA: Se não for rascunho, expulsa o usuário
                if (r.status !== 'DRAFT') {
                    alert("Apenas rascunhos podem ser editados!");
                    navigate("/dashboard");
                    return;
                }

                setDescricao(r.descricao);
                setValor(r.valor.toString());
                setCategoriaId(r.categoriaId);
                // Formata a data para o input tipo 'date' (YYYY-MM-DD)
                setDataDespesa(new Date(r.dataDespesa).toISOString().split('T')[0]);
                setLoading(false);
            } catch (error) {
                alert("Erro ao carregar dados");
                navigate("/dashboard");
            }
        }
        loadData();
    }, [id, navigate]);

    async function handleUpdate(e: React.FormEvent) {
        e.preventDefault();

        // Validações idênticas à criação
        const valorNumerico = parseFloat(valor);
        if (valorNumerico <= 0) return alert("Valor inválido");

        const hoje = new Date();
        if (new Date(dataDespesa) > hoje) return alert("A data não pode ser futura");

        try {
            // Chamada para a rota de edição (PUT ou PATCH /reembolsos/:id)
            await api.put(`/reembolsos/${id}`, {
                descricao,
                valor: valorNumerico,
                dataDespesa,
                categoriaId
            });

            alert("Rascunho atualizado!");
            navigate("/dashboard");
        } catch (error) {
            alert("Erro ao atualizar.");
        }
    }

    if (loading) return <p>Carregando...</p>;

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <Card>
                <CardHeader>
                    <CardTitle>Editar Rascunho</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleUpdate} className="space-y-4">
                        {/* Mesmos Inputs do componente de criar... */}
                        <div className="space-y-2">
                            <Label>Descrição</Label>
                            <Input value={descricao} onChange={e => setDescricao(e.target.value)} />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Valor</Label>
                                <Input type="number" value={valor} onChange={e => setValor(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Data</Label>
                                <Input type="date" value={dataDespesa} onChange={e => setDataDespesa(e.target.value)} />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Voltar</Button>
                            <Button type="submit">Salvar Alterações</Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}