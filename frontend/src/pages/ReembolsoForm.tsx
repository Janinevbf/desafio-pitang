import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import api from "@/services/api";
import { criarReembolsoSchema, CriarUsuarioInput } from "@/schemas/usuario.schema"; // Importe seu schema
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

export default function ReembolsoForm() {
    const { id } = useParams(); // Se existir, é modo Edição
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [categorias, setCategorias] = useState<any[]>([]);
    const isEdit = Boolean(id);

    const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm({
        resolver: zodResolver(criarReembolsoSchema),
        defaultValues: {
            descricao: "",
            valor: 0,
            dataDespesa: new Date().toISOString().split('T')[0],
            categoriaId: ""
        }
    });

    useEffect(() => {
        async function fetchData() {
            try {
                setLoading(true);
                // 1. Carregar Categorias (Apenas as ATIVAS para novas, ou todas para edição)
                const resCat = await api.get("/categorias");
                setCategorias(resCat.data.filter((c: any) => c.ativo || isEdit));

                // 2. Se for edição, carregar os dados do reembolso
                if (isEdit) {
                    const resReembolso = await api.get(`/reembolsos/${id}`);
                    const data = resReembolso.data;

                    // REQUISITO: Bloquear edição se não for rascunho
                    if (data.status !== 'DRAFT') {
                        toast.error("Apenas rascunhos podem ser editados!");
                        return navigate("/dashboard");
                    }

                    // Preencher o formulário
                    reset({
                        descricao: data.descricao,
                        valor: Number(data.valor),
                        dataDespesa: data.dataDespesa.split('T')[0],
                        categoriaId: data.categoriaId
                    });
                }
            } catch (err) {
                toast.error("Erro ao carregar dados.");
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [id, reset, navigate, isEdit]);

    const onSubmit = async (data: any) => {
        try {
            setLoading(true);
            if (isEdit) {
                await api.put(`/reembolsos/${id}`, data);
                toast.success("Solicitação atualizada!");
            } else {
                await api.post("/reembolsos", data);
                toast.success("Solicitação criada como rascunho!");
            }
            navigate("/dashboard");
        } catch (err: any) {
            toast.error(err.response?.data?.error || "Erro ao salvar.");
        } finally {
            setLoading(false);
        }
    };

    if (loading && isEdit) return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <Button variant="ghost" className="mb-4" onClick={() => navigate("/dashboard")}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Button>

            <Card>
                <CardHeader>
                    <CardTitle>{isEdit ? "Editar Solicitação" : "Nova Solicitação de Reembolso"}</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

                        <div className="space-y-2">
                            <Label htmlFor="descricao">Descrição da Despesa</Label>
                            <Textarea
                                id="descricao"
                                placeholder="Ex: Almoço com cliente X..."
                                {...register("descricao")}
                            />
                            {errors.descricao && <span className="text-sm text-red-500">{errors.descricao.message}</span>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="valor">Valor (R$)</Label>
                                <Input
                                    id="valor"
                                    type="number"
                                    step="0.01"
                                    {...register("valor", { valueAsNumber: true })}
                                />
                                {errors.valor && <span className="text-sm text-red-500">{errors.valor.message}</span>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="dataDespesa">Data da Despesa</Label>
                                <Input id="dataDespesa" type="date" {...register("dataDespesa")} />
                                {errors.dataDespesa && <span className="text-sm text-red-500">{errors.dataDespesa.message}</span>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Categoria</Label>
                            <Select
                                onValueChange={(value) => setValue("categoriaId", value)}
                                value={isEdit ? undefined : undefined} // Controlled logic
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecione uma categoria" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categorias.map((cat) => (
                                        <SelectItem key={cat.id} value={cat.id}>
                                            {cat.nome} {!cat.ativo && "(Inativa)"}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.categoriaId && <span className="text-sm text-red-500">{errors.categoriaId.message}</span>}
                        </div>

                        <div className="pt-4 flex justify-end gap-2">
                            <Button type="button" variant="outline" onClick={() => navigate("/dashboard")}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                                {loading ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                                {isEdit ? "Salvar Alterações" : "Salvar como Rascunho"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}