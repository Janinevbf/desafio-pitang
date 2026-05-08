import { useEffect, useState } from "react";
import api from "@/services/api";
import { Paperclip, PlusCircle, Eye, Pencil, LogOut } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../components/ui/table";
import { Badge } from "@/components/ui/bagde";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FinanceiroLista } from "./FinanceiroLista";

export default function Dashboard() {
    const [reembolsos, setReembolsos] = useState([]);
    const [perfil, setPerfil] = useState("");
    const navigate = useNavigate();
    const { signOut } = useAuth();

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem("@Reembolso:user") || "{}");
        setPerfil(user.perfil || "FINANCEIRO");

    }, []);

    useEffect(() => {
        api.get("/reembolsos/meus-reembolsos")
            .then(response => setReembolsos(response.data))
            .catch(err => console.error("Erro ao carregar reembolsos", err));
    }, []);

    const handleLogout = () => {
        signOut();
        navigate("/login");
    };

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
        <div className="p-8 max-w-6xl mx-auto space-y-8 bg-slate-50 min-h-screen">

            <div className="flex justify-between items-end border-b pb-6 border-orange-100">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-800">Dashboard</h1>
                    <p className="text-muted-foreground italic">
                        Bem-vindo ao sistema de gestão de despesas.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={() => navigate("/reembolsos/novo")}
                        className="bg-orange-500 hover:bg-orange-600 shadow-md transition-all"
                    >
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Novo Reembolso
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleLogout}
                        className="border-red-300 text-red-600 hover:bg-red-50"
                    >
                        <LogOut className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="meus" className="w-full">
                <TabsList className="grid w-full max-w-[400px] grid-cols-2 mb-6 bg-orange-50 p-1">
                    <TabsTrigger
                        value="meus"
                        className="data-[state=active]:bg-orange-500 data-[state=active]:text-white"
                    >
                        Minhas Solicitações
                    </TabsTrigger>
                    {isFinanceiro && (
                        <TabsTrigger
                            value="financeiro"
                            className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white"
                        >
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
                                <TableHead className="font-bold text-orange-900">Categoria</TableHead>
                                <TableHead className="font-bold text-orange-900">Valor</TableHead>
                                <TableHead className="font-bold text-orange-900">Status</TableHead>
                                <TableHead className="font-bold text-orange-900">Anexo</TableHead>
                                <TableHead className="text-right font-bold text-orange-900">Ações</TableHead>
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
                                    <TableRow key={item.id} className="hover:bg-orange-50/30 transition-colors">
                                        <TableCell>{new Date(item.dataDespesa).toLocaleDateString('pt-BR')}</TableCell>
                                        <TableCell className="font-medium">{item.descricao}</TableCell>
                                        <TableCell>
                                            <span className="px-2 py-1 rounded-full bg-slate-100 text-xs">
                                                {item.categoria?.nome || 'Sem categoria'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="font-semibold text-gray-700">
                                            {Number(item.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={`${getStatusColor(item.status)} border-none shadow-sm`}>
                                                {item.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {item.anexos?.[0] ? (
                                                <a href={item.anexos[0].urlArquivo} target="_blank" rel="noreferrer" className="text-orange-600 flex items-center hover:underline font-medium">
                                                    <Paperclip className="h-3 w-3 mr-1" /> Ver
                                                </a>
                                            ) : <span className="text-gray-400">---</span>}
                                        </TableCell>
                                        <TableCell className="text-right space-x-2">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="hover:bg-orange-50 border-orange-200"
                                                onClick={() => navigate(`/reembolsos/${item.id}`)}
                                            >
                                                <Eye className="h-4 w-4 text-orange-600" />
                                            </Button>

                                            {(item.status === "DRAFT" || item.status === "RASCUNHO") && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="hover:bg-amber-50"
                                                    onClick={() => navigate(`/reembolsos/editar/${item.id}`)}
                                                >
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


                {isFinanceiro && (
                    <TabsContent value="financeiro" className="border rounded-lg bg-white shadow-lg p-6 border-emerald-100">
                        <div className="flex items-center gap-2 mb-4 text-emerald-700 font-bold">
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            Aguardando Pagamento
                        </div>
                        <FinanceiroLista />
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
}