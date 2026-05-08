import React, { useState, useEffect } from "react";
import api from "@/services/api";
import {
    PlusCircle,
    Pencil,
    Loader2,
    Tag,
    Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function CategoriasAdmin() {
    const [categorias, setCategorias] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filtro, setFiltro] = useState("");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editandoId, setEditandoId] = useState<string | null>(null);
    const [nomeCategoria, setNomeCategoria] = useState("");
    const [salvando, setSalvando] = useState(false);

    useEffect(() => {
        carregarCategorias();
    }, []);

    async function carregarCategorias() {
        try {
            setLoading(true);
            const res = await api.get("/categorias");
            setCategorias(res.data);
        } catch (err) {
            toast.error("Erro ao carregar categorias.");
        } finally {
            setLoading(false);
        }
    }

    async function handleSalvar(e: React.FormEvent) {
        e.preventDefault();
        const nomeLimpo = nomeCategoria.trim();
        if (!nomeLimpo) return;

        try {
            setSalvando(true);

            if (editandoId) {
                const categoriaOriginal = categorias.find(c => c.id === editandoId);


                await api.put(`/categorias/${editandoId}`, {
                    nome: nomeLimpo,
                    ativo: categoriaOriginal?.ativo
                });
                toast.success("Categoria atualizada!");
            } else {
                await api.post("/categorias", {
                    nome: nomeLimpo,
                    ativo: true
                });
                toast.success("Categoria criada!");
            }

            fecharModal();
            carregarCategorias();
        } catch (err: any) {

            if (err.response?.data?.error === "Este nome de categoria já está em uso") {
                toast.error("Você já tem uma categoria com este nome.");
            } else {
                toast.error("Erro ao salvar categoria.");
            }
        } finally {
            setSalvando(false);
        }
    }

    async function toggleStatus(id: string, nome: string, ativoAtual: boolean) {
        try {
            const novoStatus = !ativoAtual;

            console.log(`Enviando para o Back: { nome: "${nome}", ativo: ${novoStatus} }`);
            await api.put(`/categorias/${id}`, {
                nome: nome,
                ativo: novoStatus
            });


            setCategorias(prev => prev.map(c =>
                c.id === id ? { ...c, ativo: novoStatus } : c
            ));

            toast.success(`Categoria ${novoStatus ? "ativada" : "desativada"}!`);
        } catch (err: any) {
            console.error("Erro no Back-end:", err.response?.data);
            toast.error("Não foi possível alterar o status.");
        }
    }

    function abrirModal(categoria?: any) {
        if (categoria) {
            setEditandoId(categoria.id);
            setNomeCategoria(categoria.nome);
        } else {
            setEditandoId(null);
            setNomeCategoria("");
        }
        setIsModalOpen(true);
    }

    function fecharModal() {
        setIsModalOpen(false);
        setNomeCategoria("");
        setEditandoId(null);
    }

    const categoriasFiltradas = categorias.filter(c =>
        c.nome.toLowerCase().includes(filtro.toLowerCase())
    );

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2 text-slate-800">
                        <Tag className="text-orange-500 h-6 w-6" /> Gestão de Categorias
                    </h1>
                    <p className="text-sm text-slate-500">Administração de tipos de despesa.</p>
                </div>

                <div className="flex w-full md:w-auto gap-3">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                            placeholder="Buscar..."
                            className="pl-9"
                            value={filtro}
                            onChange={(e) => setFiltro(e.target.value)}
                        />
                    </div>
                    <Button onClick={() => abrirModal()} className="bg-orange-500 hover:bg-orange-600">
                        <PlusCircle className="mr-2 h-4 w-4" /> Nova Categoria
                    </Button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin text-orange-500" /></div>
                ) : (
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="font-bold">Nome</TableHead>
                                <TableHead className="w-[200px] text-center font-bold">Status</TableHead>
                                <TableHead className="w-[150px] text-right font-bold">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {categoriasFiltradas.map((cat) => (
                                <TableRow key={cat.id}>
                                    <TableCell className="font-medium">{cat.nome}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-center gap-4">
                                            <Badge
                                                variant={cat.ativo ? "default" : "secondary"}
                                                className={cat.ativo ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"}
                                            >
                                                {cat.ativo ? "Ativa" : "Inativa"}
                                            </Badge>
                                            <Switch
                                                checked={cat.ativo}
                                                onCheckedChange={() => toggleStatus(cat.id, cat.nome, cat.ativo)}
                                            />
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => abrirModal(cat)}>
                                            <Pencil className="h-4 w-4 mr-2" /> Editar
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            <Dialog open={isModalOpen} onOpenChange={fecharModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editandoId ? "Editar Categoria" : "Nova Categoria"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSalvar} className="space-y-4 pt-4">
                        <div className="space-y-2">
                            <Label htmlFor="nome">Nome</Label>
                            <Input
                                id="nome"
                                value={nomeCategoria}
                                onChange={(e) => setNomeCategoria(e.target.value)}
                                placeholder="Ex: RH, Viagens..."
                                autoFocus
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={fecharModal}>Cancelar</Button>
                            <Button
                                type="submit"
                                className="bg-orange-500 hover:bg-orange-600"
                                disabled={salvando || !nomeCategoria.trim()}
                            >
                                {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}