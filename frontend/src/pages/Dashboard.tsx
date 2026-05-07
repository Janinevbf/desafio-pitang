import { useEffect, useState } from "react";
import api from "@/services/api";
import { Paperclip, PlusCircle, Eye, Pencil } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../components/ui/table";
import { Badge } from "@/components/ui/bagde"; // Verifique se o nome da pasta é 'bagde' ou 'badge'
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FinanceiroLista } from "./FinanceiroLista";

export default function Dashboard() {
    const [reembolsos, setReembolsos] = useState([]);
    const [perfil, setPerfil] = useState("");
    const navigate = useNavigate();

    // 1. Carregar perfil do usuário
    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("@Reembolso:user") || "{}");
        // Mantive sua lógica: se vazio, assume FINANCEIRO para teste
        setPerfil(user.perfil || "FINANCEIRO");

    }, []);

    // 2. Carregar meus reembolsos
    useEffect(() => {
        api.get("/reembolsos/meus-reembolsos")
            .then(response => setReembolsos(response.data))
            .catch(err => console.error("Erro ao carregar reembolsos", err));
    }, []);

    const isFinanceiro = perfil === "FINANCEIRO" || perfil === "GESTOR";

    const getStatusColor = (status: string) => {
        const s = status?.toUpperCase();
        if (s === 'PAID' || s === 'PAGO') return 'bg-blue-500 text-white';
        if (s === 'APPROVED' || s === 'APROVADO') return 'bg-green-600 text-white';
        if (s === 'REJECTED' || s === 'REJEITADO') return 'bg-red-600 text-white';
        if (s === 'SUBMITTED') return 'bg-yellow-500 text-black';
        return 'bg-gray-200 text-gray-800';
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            {/* Cabeçalho */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">Bem-vindo ao sistema de gestão de despesas.</p>
                </div>
                <Button onClick={() => navigate("/reembolsos/novo")} className="bg-indigo-600 hover:bg-indigo-700">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Novo Reembolso
                </Button>
            </div>

            {/* Sistema de Abas */}
            <Tabs defaultValue="meus" className="w-full">
                <TabsList className="grid w-full max-w-[400px] grid-cols-2 mb-6">
                    <TabsTrigger value="meus">Minhas Solicitações</TabsTrigger>
                    {isFinanceiro && (
                        <TabsTrigger value="financeiro" className="data-[state=active]:bg-green-600 data-[state=active]:text-white">
                            Fila de Pagamento
                        </TabsTrigger>
                    )}
                </TabsList>

                {/* ABA 1: MEUS REEMBOLSOS */}
                <TabsContent value="meus" className="border rounded-lg bg-white shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>Descrição</TableHead>
                                <TableHead>Categoria</TableHead>
                                <TableHead>Valor</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Anexo</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reembolsos.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="p-10 text-center text-muted-foreground italic">
                                        Nenhuma solicitação encontrada.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                reembolsos.map((item: any) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{new Date(item.dataDespesa).toLocaleDateString('pt-BR')}</TableCell>
                                        <TableCell className="font-medium">{item.descricao}</TableCell>
                                        <TableCell>{item.categoria?.nome || 'Sem categoria'}</TableCell>
                                        <TableCell className="font-semibold">
                                            {Number(item.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`${getStatusColor(item.status)} border-none shadow-none`}>
                                                {item.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {item.anexos?.[0] ? (
                                                <a href={item.anexos[0].urlArquivo} target="_blank" rel="noreferrer" className="text-blue-600 flex items-center hover:underline">
                                                    <Paperclip className="h-3 w-3 mr-1" /> Ver
                                                </a>
                                            ) : <span className="text-gray-400">---</span>}
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => navigate(`/reembolsos/${item.id}`)} // Sem a palavra 'detalhe'
                                            >
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            {(item.status === "DRAFT") && (
                                                <Button variant="ghost" size="icon" onClick={() => navigate(`/reembolsos/editar/${item.id}`)}>
                                                    <Pencil className="h-4 w-4 text-amber-600" />
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TabsContent>

                {/* ABA 2: FILA FINANCEIRA */}
                {isFinanceiro && (
                    <TabsContent value="financeiro" className="border rounded-lg bg-white shadow-sm p-6">
                        <FinanceiroLista />
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
}