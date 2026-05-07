import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/bagde";
import { ArrowLeft, Send, Paperclip, CheckCircle, XCircle } from "lucide-react";

export default function ReembolsoDetalhe() {
    const { id } = useParams();
    const navigate = useNavigate();

    // Estados
    const [reembolso, setReembolso] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [justificativa, setJustificativa] = useState("");
    const [showRejeitarForm, setShowRejeitarForm] = useState(false);
    const [mostrarCampoRejeitar, setMostrarCampoRejeitar] = useState(false);
    const [perfilUsuario, setPerfilUsuario] = useState<string>("");



    useEffect(() => {
        const carregarDados = async () => {
            // 1. Pegar perfil do storage
            const userJson = localStorage.getItem("@Reembolso:user");
            if (userJson) {
                const user = JSON.parse(userJson);
                // Usamos toUpperCase para evitar erro de "Financeiro" vs "FINANCEIRO"
                setPerfilUsuario(user.perfil?.toUpperCase() || "");
            }

            // 2. Buscar reembolso
            if (id) {
                try {
                    const res = await api.get(`/reembolsos/${id}`);
                    setReembolso(res.data);
                } catch (err) {
                    console.error("Erro ao carregar", err);
                }
            }
        };

        carregarDados();
    }, [id]);
    const statusAtual = reembolso?.status?.toUpperCase();
    const isFinanceiro = perfilUsuario === 'FINANCEIRO';
    const isAprovado = statusAtual === 'APPROVED';
    // Funções de Ação
    const handleEnviarParaAnalise = async () => {
        try {
            setLoading(true);
            await api.post(`/reembolsos/${id}/enviar`);
            alert("Enviado com sucesso!");
            navigate("/dashboard");
        } catch (err) {
            alert("Erro ao enviar.");
        } finally {
            setLoading(false);
        }
    };

    const handleAvaliar = async (novoStatus: 'APROVADO' | 'REJEITADO') => {
        if (novoStatus === 'REJEITADO' && !justificativa) {
            alert("Justificativa obrigatória.");
            return;
        }
        try {
            setLoading(true);
            await api.patch(`/reembolsos/${id}/avaliar`, {
                status: novoStatus,
                justificativa
            });
            alert(`Solicitação ${novoStatus.toLowerCase()}!`);
            navigate("/dashboard");
        } catch (err) {
            alert("Erro na avaliação.");
        } finally {
            setLoading(false);
        }
    };
    const handlePagar = async () => {
        try {
            setLoading(true);
            // Rota: PATCH /reembolsos/:id/pagar
            await api.patch(`/reembolsos/${id}/pagar`);
            alert("Pagamento confirmado com sucesso!");
            navigate("/dashboard");
        } catch (err) {
            alert("Erro ao processar pagamento.");
        } finally {
            setLoading(false);
        }
    };
    const handleConfirmarPagamento = async () => {
        const podePagar = (perfilUsuario === 'FINANCEIRO' || perfilUsuario === 'GESTOR')
            && reembolso?.status === 'APPROVED';
        try {
            setLoading(true);
            // Rota correta do seu backend: PATCH /reembolsos/:id/pagar
            await api.patch(`/reembolsos/${id}/pagar`);

            alert("Pagamento registrado com sucesso!");
            navigate("/dashboard"); // Volta para o dashboard após pagar
        } catch (error: any) {
            console.error("Erro ao pagar:", error);
            alert(error.response?.data?.error || "Erro ao confirmar pagamento.");
        } finally {
            setLoading(false);
        }
    };

    if (!reembolso) return <div className="p-8 text-center">Carregando...</div>;

    const isGestor = perfilUsuario?.toUpperCase() === 'GESTOR';
    const isSubmitted = reembolso.status?.toUpperCase() === 'SUBMITTED';

    return (
        <div className="p-8 max-w-3xl mx-auto">
            <Button variant="ghost" className="mb-4" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between border-b bg-slate-50/50">
                    <div>
                        <CardTitle>Detalhes da Solicitação</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">ID: {id?.slice(0, 8)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {reembolso.status === 'DRAFT' && (
                            <Button variant="outline" size="sm" onClick={() => navigate(`/reembolsos/editar/${reembolso.id}`)}>
                                Editar
                            </Button>
                        )}
                        <Badge className={
                            reembolso.status === 'PAID' ? "bg-green-600" :
                                reembolso.status === 'REJECTED' ? "bg-red-600" : "bg-blue-600"
                        }>
                            {reembolso.status}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">

                    {/* Dados Básicos */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Descrição</p>
                            <p className="font-medium">{reembolso.descricao}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Valor</p>
                            <p className="font-bold text-xl text-green-700">
                                {Number(reembolso.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </p>
                        </div>
                    </div>
                    {/* --- ÁREA DE PAGAMENTO (Liberada para Gestor e Financeiro testarem) --- */}
                    {reembolso.status?.toUpperCase() === 'APPROVED' && (perfilUsuario === 'FINANCEIRO' || perfilUsuario === 'GESTOR') && (
                        <div className="mt-6 p-6 border-2 border-blue-200 bg-blue-50 rounded-xl shadow-sm animate-in fade-in zoom-in duration-300">
                            <div className="flex items-center gap-3 mb-4 text-blue-800">
                                <div className="p-2 bg-blue-100 rounded-full">
                                    <CheckCircle className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">Processar Pagamento</h3>
                                    <p className="text-sm text-blue-600">
                                        {perfilUsuario === 'GESTOR'
                                            ? "Você tem permissão de Gestor para confirmar este pagamento."
                                            : "Aguardando confirmação de transferência bancária."}
                                    </p>
                                </div>
                            </div>

                            <Button
                                onClick={handleConfirmarPagamento}
                                disabled={loading}
                                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold transition-all shadow-md"
                            >
                                {loading ? "Processando..." : "Confirmar que o Reembolso foi PAGO"}
                            </Button>
                        </div>
                    )}
                    {/* Área do Gestor (O Painel Amarelo) */}
                    {isGestor && isSubmitted && (
                        <div className="bg-amber-50 p-4 rounded-lg border-2 border-amber-200 space-y-4">
                            <h3 className="font-bold text-amber-800">Decisão do Gestor</h3>

                            {mostrarCampoRejeitar && (
                                <textarea
                                    className="w-full p-2 border rounded"
                                    placeholder="Motivo da rejeição..."
                                    value={justificativa}
                                    onChange={(e) => setJustificativa(e.target.value)}
                                />
                            )}

                            <div className="flex gap-2">
                                {!mostrarCampoRejeitar ? (
                                    <>
                                        <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleAvaliar('APROVADO')} disabled={loading}>Aprovar</Button>
                                        <Button variant="destructive" onClick={() => setMostrarCampoRejeitar(true)}>Rejeitar</Button>
                                    </>
                                ) : (
                                    <>
                                        <Button variant="destructive" onClick={() => handleAvaliar('REJEITADO')} disabled={loading}>Confirmar Rejeição</Button>
                                        <Button variant="outline" onClick={() => setMostrarCampoRejeitar(false)}>Cancelar</Button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}
                    {/* --- PAINEL EXCLUSIVO DO FINANCEIRO --- */}
                    {isFinanceiro && isAprovado && (
                        <div className="mt-6 p-6 border-2 border-blue-200 bg-blue-50 rounded-xl shadow-sm">
                            <div className="flex items-center gap-3 mb-4 text-blue-800">
                                <div className="p-2 bg-blue-100 rounded-full">
                                    <CheckCircle className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold">Área Financeira</h3>
                                    <p className="text-sm text-blue-600">Confirme após efetuar a transferência.</p>
                                </div>
                            </div>

                            <Button
                                onClick={handleConfirmarPagamento}
                                disabled={loading}
                                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold"
                            >
                                {loading ? "Processando..." : "Confirmar Pagamento"}
                            </Button>
                        </div>
                    )}
                    {/* Rodapé */}
                    <div className="flex justify-end gap-2 border-t pt-4">
                        <Button variant="outline" onClick={() => navigate("/dashboard")}>Sair</Button>
                        {reembolso.status === 'DRAFT' && (
                            <Button onClick={handleEnviarParaAnalise} disabled={loading} className="bg-blue-600">
                                Enviar para Análise
                            </Button>
                        )}
                    </div>
                    {/* --- SEÇÃO DE HISTÓRICO / AUDITORIA --- */}
                    <div className="mt-8 space-y-4">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                            <Paperclip className="h-5 w-5" /> Histórico da Solicitação
                        </h3>

                        <div className="border-l-2 border-slate-200 ml-3 pl-6 space-y-6">
                            {reembolso.historicos?.length > 0 ? (
                                reembolso.historicos.map((h: any) => (
                                    <div key={h.id} className="relative">
                                        {/* Pontinho na linha do tempo */}
                                        <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-slate-300 border-2 border-white" />

                                        <div className="bg-white p-3 rounded-lg border shadow-sm">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="font-bold text-sm text-slate-800">
                                                    {h.acao}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(h.createdAt).toLocaleString('pt-BR')}
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-600">
                                                Por: <span className="font-medium">{h.usuario?.nome || "Sistema"}</span>
                                            </p>
                                            {h.observacao && (
                                                <p className="mt-2 text-sm italic bg-slate-50 p-2 rounded border-l-4 border-slate-300">
                                                    "{h.observacao}"
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground italic">Nenhum histórico registrado.</p>
                            )}
                            {/* --- SEÇÃO DE HISTÓRICO --- */}
                            <div className="mt-10 border-t pt-6">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <Paperclip className="h-5 w-5" /> Trilha de Auditoria
                                </h3>

                                <div className="space-y-4">
                                    {reembolso.historicos?.map((log: any) => (
                                        <div key={log.id} className="flex gap-4 border-l-2 border-slate-200 ml-2 pl-4 relative">
                                            {/* Marcador na linha */}
                                            <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-slate-300 border-2 border-white" />

                                            <div className="flex-1 bg-slate-50 p-3 rounded-lg text-sm shadow-sm">
                                                <div className="flex justify-between items-start">
                                                    <span className="font-bold text-slate-700">{log.acao}</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {new Date(log.criadoEm).toLocaleString('pt-BR')}
                                                    </span>
                                                </div>
                                                <p className="text-slate-600 mt-1">
                                                    Realizado por: <span className="font-medium">{log.usuario.nome}</span> ({log.usuario.perfil})
                                                </p>
                                                {log.observacao && (
                                                    <p className="mt-2 p-2 bg-white rounded border italic text-slate-500">
                                                        "{log.observacao}"
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}