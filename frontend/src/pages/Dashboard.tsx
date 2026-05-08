import { useEffect, useState } from "react";
import api from "@/services/api";
import { Paperclip, PlusCircle, Eye, Pencil, LogOut, Tag } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FinanceiroLista } from "./FinanceiroLista";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
    const [reembolsos, setReembolsos] = useState([]);
    const [perfil, setPerfil] = useState("");
    const navigate = useNavigate();
    const { signOut } = useAuth();

    useEffect(() => {
        const userData = localStorage.getItem("@Reembolso:user");
        if (userData) {
            const user = JSON.parse(userData);
            setPerfil(user.perfil);
        }
    }, []);

    useEffect(() => {
        if (!perfil) return;

        const endpoint = perfil === "GESTOR"
            ? "/reembolsos/pendentes"
            : "/reembolsos/meus-reembolsos";

        api.get(endpoint)
            .then(response => setReembolsos(response.data))
            .catch(err => console.error("Erro ao carregar reembolsos", err));
    }, [perfil]);

    const handleLogout = () => {
        signOut();
        navigate("/login");
    };

    const handleUpdateStatus = async (id: string, novoStatus: string) => {
        try {
            if (novoStatus === 'SUBMITTED') {
                await api.post(`/reembolsos/${id}/enviar`);
            } else {
                let justificativa = "Avaliado pelo gestor.";

                if (novoStatus === 'REJEITADO') {
                    const motivo = prompt("Informe a justificativa da rejeição:");
                    if (!motivo) return;
                    justificativa = motivo;
                }

                await api.patch(`/reembolsos/${id}/avaliar`, {
                    status: novoStatus === 'APPROVED' ? 'APROVADO' : 'REJEITADO',
                    justificativa: justificativa
                });
            }

            alert("Operação realizada com sucesso!");
            setReembolsos((prev) => prev.filter((item: any) => item.id !== id));
        } catch (err: any) {
            console.error("Erro detalhado:", err.response?.data);
            alert(err.response?.data?.error || "Erro ao processar.");
        }
    };

    const getStatusColor = (status: string) => {
        const s = status?.toUpperCase();
        if (s === 'PAID' || s === 'PAGO') return 'bg-blue-500 text-white hover:bg-blue-600';
        if (s === 'APPROVED' || s === 'APROVADO') return 'bg-green-600 text-white hover:bg-green-700';
        if (s === 'REJECTED' || s === 'REJEITADO') return 'bg-red-600 text-white hover:bg-red-700';
        if (s === 'SUBMITTED' || s === 'ENVIADO') return 'bg-yellow-500 text-black hover:bg-yellow-600';
        return 'bg-gray-200 text-gray-800';
    };

    const isColaborador = perfil === "COLABORADOR";
    const isGestor = perfil === "GESTOR";
    const isFinanceiro = perfil === "FINANCEIRO";
    const isAdmin = perfil === "ADMIN"; // Verificação para o botão de categorias

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 bg-slate-50 min-h-screen">
            <div className="flex justify-between items-end border-b pb-6 border-orange-100">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-800">Dashboard</h1>
                    <p className="text-muted-foreground italic">Bem-vindo, perfil: <strong>{perfil}</strong></p>
                </div>
                <div className="flex gap-2">
                    {/* Botão Gerenciar Categorias só para Admin ou Gestor (opcional) */}
                    {(isAdmin || isGestor) && (
                        <Button
                            variant="outline"
                            onClick={() => navigate("/admin/categorias")}
                            className="border-orange-500 text-orange-600 hover:bg-orange-50"
                        >
                            <Tag className="mr-2 h-4 w-4" /> Categorias
                        </Button>
                    )}

                    {isColaborador && (
                        <Button
                            onClick={() => navigate("/reembolsos/novo")}
                            className="bg-orange-500 hover:bg-orange-600 shadow-md"
                        >
                            <PlusCircle className="mr-2 h-4 w-4" /> Novo Reembolso
                        </Button>
                    )}
                    <Button variant="outline" onClick={handleLogout} className="border-red-300 text-red-600 hover:bg-red-50">
                        <LogOut className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="meus" className="w-full">
                <TabsList className="grid w-full max-w-[400px] grid-cols-2 mb-6 bg-orange-50 p-1">
                    <TabsTrigger value="meus" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white">
                        {isGestor ? "Para Avaliar" : "Minhas Solicitações"}
                    </TabsTrigger>
                    {isFinanceiro && (
                        <TabsTrigger value="financeiro" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                            Fila de Pagamento
                        </TabsTrigger>
                    )}
                </TabsList>

                <TabsContent value="meus" className="border rounded-lg bg-white shadow-lg overflow-hidden border-orange-100">
                    <Table>
                        <TableHeader className="bg-orange-50/50">
                            <TableRow>
                                <TableHead className="font-bold text-orange-900">Data</TableHead>
                                <TableHead className="font-bold text-orange-900">Descrição</TableHead>
                                <TableHead className="font-bold text-orange-900">Valor</TableHead>
                                <TableHead className="font-bold text-orange-900">Status</TableHead>
                                <TableHead className="font-bold text-orange-900">Anexo</TableHead>
                                <TableHead className="text-right font-bold text-orange-900">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reembolsos.map((item: any) => (
                                <TableRow key={item.id}>
                                    <TableCell>{new Date(item.dataDespesa).toLocaleDateString('pt-BR')}</TableCell>
                                    <TableCell className="font-medium">{item.descricao}</TableCell>
                                    <TableCell>{Number(item.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</TableCell>
                                    <TableCell>
                                        <Badge className={getStatusColor(item.status)}>{item.status}</Badge>
                                    </TableCell>

                                    {/* COLUNA DE ANEXO CORRIGIDA */}
                                    <TableCell>
                                        {item.comprovanteUrl ? (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-orange-600 hover:bg-orange-50"
                                                onClick={() => window.open(item.comprovanteUrl, '_blank')}
                                            >
                                                <Paperclip className="h-4 w-4 mr-1" /> Ver
                                            </Button>
                                        ) : (
                                            <span className="text-xs text-gray-400">Sem arquivo</span>
                                        )}
                                    </TableCell>

                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {isGestor && item.status === "SUBMITTED" && (
                                                <>
                                                    <Button size="sm" className="bg-green-600" onClick={() => handleUpdateStatus(item.id, 'APPROVED')}>Aprovar</Button>
                                                    <Button size="sm" variant="destructive" onClick={() => handleUpdateStatus(item.id, 'REJEITADO')}>Rejeitar</Button>
                                                </>
                                            )}

                                            {isColaborador && (item.status === "DRAFT" || item.status === "RASCUNHO") && (
                                                <>
                                                    <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(item.id, 'SUBMITTED')}>Enviar</Button>
                                                    <Button variant="ghost" size="icon" onClick={() => navigate(`/reembolsos/editar/${item.id}`)}>
                                                        <Pencil className="h-4 w-4 text-amber-600" />
                                                    </Button>
                                                </>
                                            )}

                                            <Button variant="outline" size="icon" onClick={() => navigate(`/reembolsos/${item.id}`)}>
                                                <Eye className="h-4 w-4 text-orange-600" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TabsContent>

                {isFinanceiro && (
                    <TabsContent value="financeiro">
                        <FinanceiroLista />
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
}