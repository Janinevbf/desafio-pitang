import { useEffect, useState } from "react";
import api from "@/services/api";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../components/ui/table";
import { Badge } from "@/components/ui/bagde";
import { Button } from "@/components/ui/button";
import { PlusCircle, Eye, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
    const [reembolsos, setReembolsos] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        api.get("/reembolsos/meus-reembolsos")
            .then(response => {
                console.log("Dados recebidos:", response.data);
                setReembolsos(response.data);
            })
            .catch(err => {
                console.error("Erro ao carregar reembolsos", err);
            });
    }, []);

    // Função para definir a cor do Badge
    const getStatusColor = (status: string) => {
        const s = status?.toUpperCase();
        if (s === 'PAID' || s === 'PAGO') return 'bg-blue-500 text-white hover:bg-blue-600';
        if (s === 'APPROVED' || s === 'APROVADO') return 'bg-green-600 text-white';
        if (s === 'REJECTED' || s === 'REJEITADO') return 'bg-red-600 text-white';
        if (s === 'SUBMITTED') return 'bg-yellow-500 text-black';
        return 'bg-gray-200 text-gray-800'; // Default para DRAFT
    };

    return (
        <div className="p-8 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Meus Reembolsos</h1>
                    <p className="text-muted-foreground">Acompanhe suas solicitações de despesas.</p>
                </div>
                <Button onClick={() => navigate("/reembolsos/novo")}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Novo Reembolso
                </Button>
            </div>

            <div className="border rounded-lg bg-white shadow-sm overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Descrição</TableHead>
                            <TableHead>Categoria</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reembolsos.map((item: any) => (
                            <TableRow key={item.id}>
                                <TableCell>
                                    {new Date(item.dataDespesa).toLocaleDateString('pt-BR')}
                                </TableCell>
                                <TableCell className="font-medium">{item.descricao}</TableCell>
                                <TableCell>{item.categoria?.nome || 'Sem categoria'}</TableCell>
                                <TableCell>
                                    {Number(item.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </TableCell>
                               <TableCell>
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium shadow-sm ${getStatusColor(item.status)}`}>
        {item.status}
    </span>
</TableCell>
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button variant="outline" size="icon" title="Ver detalhes" onClick={() => navigate(`/reembolsos/detalhe/${item.id}`)}>
                                        <Eye className="h-4 w-4" />
                                    </Button>

                                    {/* Lógica de edição: Geralmente só edita se for Rascunho (DRAFT) 
                                        Ajuste o status conforme sua regra de rascunho */}
                                    {(item.status === "DRAFT" || item.status === "RASCUNHO") && (
                                        <Button variant="outline" size="icon" title="Editar" onClick={() => navigate(`/reembolsos/editar/${item.id}`)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                </TableBody>
            </Table>

            {reembolsos.length === 0 && (
                <div className="p-10 text-center text-muted-foreground">
                    Nenhuma solicitação encontrada.
                </div>
            )}
        </div>
        </div >
    );
}