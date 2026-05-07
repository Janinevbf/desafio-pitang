import { useEffect, useState } from "react";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { PlusCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";


import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CategoriasAdmin() {
    const [categorias, setCategorias] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingId, setLoadingId] = useState<string | null>(null); // Para o Switch

    // Estados para criação
    const [open, setOpen] = useState(false);
    const [novoNome, setNovoNome] = useState("");
    const [criando, setCriando] = useState(false);

    useEffect(() => {
        carregarCategorias();
    }, []);

    async function carregarCategorias() {
        try {
            const res = await api.get("/categorias");
            setCategorias(res.data);
        } catch (err) {
            toast.error("Erro ao carregar categorias.");
        } finally {
            setLoading(false);
        }
    }

    async function handleToggleAtivo(id: string, statusAtual: boolean) {
        try {
            setLoadingId(id);
            await api.put(`/categorias/${id}`, { ativo: !statusAtual });

            setCategorias(prev => prev.map(cat =>
                cat.id === id ? { ...cat, ativo: !statusAtual } : cat
            ));

            toast.success("Status atualizado!");
        } catch (err) {
            toast.error("Erro ao alterar status.");
        } finally {
            setLoadingId(null);
        }
    }

    async function handleCriarCategoria(e: React.FormEvent) {
        e.preventDefault();
        if (!novoNome.trim()) return;

        try {
            setCriando(true);
            const res = await api.post("/categorias", { nome: novoNome, ativo: true });

            setCategorias(prev => [...prev, res.data].sort((a, b) => a.nome.localeCompare(b.nome)));
            toast.success("Categoria criada!");
            setNovoNome("");
            setOpen(false); // Fecha o modal
        } catch (err: any) {
            toast.error(err.response?.data?.message || "Erro ao criar categoria.");
        } finally {
            setCriando(false);
        }
    }

    if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Gestão de Categorias</h1>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <PlusCircle className="h-4 w-4" /> Nova Categoria
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Adicionar Categoria</DialogTitle>
                        </DialogHeader>

                        <form onSubmit={handleCriarCategoria} className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="nome">Nome da Categoria</Label>
                                <Input
                                    id="nome"
                                    value={novoNome}
                                    onChange={(e) => setNovoNome(e.target.value)}
                                    placeholder="Ex: Viagens, Refeição..."
                                    autoFocus
                                />
                            </div>
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button>Abrir Modal</Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Título do Modal</DialogTitle>
                                    </DialogHeader>
                                    {/* Seu formulário ou conteúdo aqui */}
                                    <DialogFooter>
                                        <Button type="submit">Salvar</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                                <Button type="submit" disabled={criando}>
                                    {criando ? "Salvando..." : "Criar Categoria"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="border rounded-lg bg-white shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nome da Categoria</TableHead>
                            <TableHead className="w-[100px] text-center">Ativo</TableHead>
                            <TableHead className="w-[100px] text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {categorias.map((cat) => (
                            <TableRow key={cat.id}>
                                <TableCell className="font-medium">{cat.nome}</TableCell>
                                <TableCell className="text-center">
                                    <Switch
                                        checked={cat.ativo}
                                        onCheckedChange={() => handleToggleAtivo(cat.id, cat.ativo)}
                                        disabled={loadingId === cat.id}
                                    />
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="sm">Editar</Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}