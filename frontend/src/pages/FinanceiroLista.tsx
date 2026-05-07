import { useEffect, useState } from "react";
import api from "@/services/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/bagde";
import { useNavigate } from "react-router-dom";
import { DollarSign, Eye } from "lucide-react";

export function FinanceiroLista() {
    const [aprovados, setAprovados] = useState<any[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        // A rota correta conforme seu reembolso.routes.ts
        api.get("/reembolsos/aprovados")
            .then(res => {
                console.log("Dados do financeiro:", res.data);
                setAprovados(res.data);
            })
            .catch(err => {
                console.error("Erro ao carregar aprovados:", err);
                // Se der erro 403, é porque o perfil no LocalStorage não é 'FINANCEIRO'
            });
    }, []);

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-800">Pendentes de Pagamento</h2>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Colaborador</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {aprovados.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                                Nenhum pagamento pendente no momento.
                            </TableCell>
                        </TableRow>
                    ) : (
                        aprovados.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.usuario?.nome || "Sistema"}</TableCell>
                                <TableCell>{item.descricao}</TableCell>
                                <TableCell>
                                    {Number(item.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </TableCell>
                                <TableCell>
                                    <Badge className="bg-green-100 text-green-800 border-green-200">Aprovado</Badge>
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => navigate(`/reembolsos/${item.id}`)} // Sem a palavra 'detalhe'
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}