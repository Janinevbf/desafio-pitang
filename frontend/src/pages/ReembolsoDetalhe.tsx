import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/bagde";
import { useAuth } from "../context/AuthContext";
import { ArrowLeft, FileText, History, Calendar, DollarSign, PlusCircle } from "lucide-react";

export default function ReembolsoDetalhe() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [reembolso, setReembolso] = useState<any>(null);
    const [historico, setHistorico] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);

    const [showRejeitar, setShowRejeitar] = useState(false);
    const [motivo, setMotivo] = useState("");

    useEffect(() => {
        async function carregarDados() {
            try {
                const [resDetalhe, resHistorico] = await Promise.all([
                    api.get(`/reembolsos/${id}`),
                    api.get(`/reembolsos/${id}/historico`)
                ]);
                setReembolso(resDetalhe.data);
                setHistorico(resHistorico.data);
            } catch (err) {
                console.error("Erro ao carregar detalhes", err);
            } finally {
                setLoading(false);
            }
        }
        carregarDados();
    }, [id]);

    // Função para Aprovar ou Rejeitar (Gestor)
    const handleAvaliar = async (novoStatus: 'APROVADO' | 'REJEITADO', justificativa?: string) => {
        try {
            await api.patch(`/reembolsos/${id}/avaliar`, {
                status: novoStatus,
                justificativa: justificativa || "Ação realizada pelo gestor."
            });
            alert(`Solicitação ${novoStatus} com sucesso!`);
            setShowRejeitar(false);
            window.location.reload();
        } catch (error) {
            console.error(error);
            alert("Erro ao avaliar solicitação.");
        }
    };

    // Função para Pagar (Financeiro)
    const handlePagar = async () => {
        try {
            await api.patch(`/reembolsos/${id}/pagar`);
            alert("Pagamento confirmado!");
            window.location.reload();
        } catch (error) {
            console.error(error);
            alert("Erro ao confirmar pagamento.");
        }

    };

    async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('arquivo', file);

        setUploading(true);
        try {
            await api.post(`/reembolsos/${id}/anexos`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert("Comprovante enviado!");
            window.location.reload();
        } catch (err) {
            alert("Erro ao enviar arquivo.");
        } finally {
            setUploading(false);
        }
    }

    if (loading) return <div className="p-8 text-center">Carregando...</div>;
    if (!reembolso) return <div className="p-8 text-center">Solicitação não encontrada.</div>;

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-6">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>

            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold">{reembolso.descricao}</h1>
                    <p className="text-muted-foreground">ID: {reembolso.id}</p>
                </div>
                <Badge className="text-lg px-4 py-1">{reembolso.status}</Badge>
            </div>

            {/* BARRA DE AÇÕES - GESTOR */}
            {user?.perfil === "GESTOR" && reembolso?.status === "SUBMITTED" && (
                <div className="flex gap-3 p-4 bg-slate-100 rounded-lg border border-slate-200">
                    <Button
                        onClick={() => handleAvaliar("APROVADO")}
                        className="bg-green-600 hover:bg-green-700 text-white"
                    >
                        Aprovar Solicitação
                    </Button>

                    <Button
                        onClick={() => setShowRejeitar(true)}
                        variant="destructive"
                    >
                        Rejeitar
                    </Button>
                </div>
            )}

            {/* BARRA DE AÇÕES - FINANCEIRO */}
            {user?.perfil === "FINANCEIRO" && reembolso?.status === "APPROVED" && (
                <div className="flex gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <Button
                        onClick={handlePagar}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        Confirmar Pagamento
                    </Button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle className="flex items-center">
                            <FileText className="mr-2 h-5 w-5" /> Informações da Despesa
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-xs uppercase text-muted-foreground">Valor</Label>
                                <div className="text-xl font-semibold flex items-center">
                                    <DollarSign className="h-4 w-4 mr-1 text-green-600" />
                                    {Number(reembolso.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </div>
                            </div>
                            <div>
                                <Label className="text-xs uppercase text-muted-foreground">Data</Label>
                                <div className="text-lg flex items-center">
                                    <Calendar className="h-4 w-4 mr-2" />
                                    {new Date(reembolso.dataDespesa).toLocaleDateString('pt-BR')}
                                </div>
                            </div>
                        </div>
                        <div>
                            <Label className="text-xs uppercase text-muted-foreground">Categoria</Label>
                            <div className="text-lg">{reembolso.categoria?.nome || "Geral"}</div>
                        </div>

                        {reembolso.justificativaRejeicao && (
                            <div className="p-4 bg-red-50 border border-red-100 rounded-md">
                                <Label className="text-red-800 font-bold">Motivo da Rejeição:</Label>
                                <p className="text-red-700">{reembolso.justificativaRejeicao}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center text-md">
                            <History className="mr-2 h-5 w-5" /> Histórico
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-6 p-4 border-2 border-dashed border-gray-200 rounded-lg text-center">
                            <input type="file" id="file-upload" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                                <PlusCircle className="h-6 w-6 text-blue-500 mb-1" />
                                <span className="text-xs font-medium">{uploading ? "Enviando..." : "Subir Comprovante"}</span>
                            </label>
                        </div>

                        <div className="space-y-4">
                            {historico.map((h: any) => (
                                <div key={h.id} className="border-l-2 border-gray-200 pl-4 pb-2 relative">
                                    <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary" />
                                    <p className="text-sm font-bold">{h.status}</p>
                                    <p className="text-xs text-muted-foreground">{h.dataFormatada || new Date(h.createdAt).toLocaleString()}</p>
                                    {h.observacao && <p className="text-xs italic mt-1">"{h.observacao}"</p>}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* MODAL DE REJEIÇÃO */}
            {showRejeitar && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
                    <Card className="w-full max-w-md">
                        <CardHeader><CardTitle className="text-red-600">Rejeitar Reembolso</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <textarea
                                className="w-full p-3 border rounded-md"
                                rows={4}
                                placeholder="Motivo da rejeição..."
                                value={motivo}
                                onChange={(e) => setMotivo(e.target.value)}
                            />
                            <div className="flex justify-end gap-3">
                                <Button variant="ghost" onClick={() => setShowRejeitar(false)}>Cancelar</Button>
                                <Button
                                    variant="destructive"
                                    disabled={!motivo.trim()}
                                    onClick={() => handleAvaliar("REJEITADO", motivo)}
                                >
                                    Confirmar Rejeição
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

function Label({ children, className }: any) {
    return <label className={`block text-sm font-medium leading-none mb-1 ${className}`}>{children}</label>;
}