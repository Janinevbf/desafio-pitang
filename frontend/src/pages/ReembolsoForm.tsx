import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import api from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { criarReembolsoSchema } from "@/schemas/reembolso.schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TextArea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, PlusCircle, Save, LogOut } from "lucide-react";
import { toast } from "sonner";

export default function ReembolsoForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [categorias, setCategorias] = useState<any[]>([]);
    const isEdit = Boolean(id);
    const { signOut } = useAuth();

    const handleLogout = () => {
        signOut();
        navigate("/login");
    };

    const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm({
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

                const resCat = await api.get("/categorias");
                const cats = resCat.data.filter((c: any) => c.ativo || isEdit);
                setCategorias(cats);

                if (!isEdit && cats.length > 0) {
                    const primeiraAtiva = cats.find((c: any) => c.ativo);
                    if (primeiraAtiva) {
                        setValue("categoriaId", primeiraAtiva.id);
                    }
                }

                if (isEdit) {
                    const resReembolso = await api.get(`/reembolsos/${id}`);
                    const data = resReembolso.data;


                    if (data.status !== 'DRAFT') {
                        toast.error("Apenas rascunhos podem ser editados!");
                        return navigate("/dashboard");
                    }

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
        <div className="p-8 max-w-2xl mx-auto min-h-screen bg-slate-50">
            <div className="flex justify-between items-center mb-4">
                <Button
                    variant="ghost"
                    className="text-gray-600 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                    onClick={() => navigate("/dashboard")}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
                <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                    <LogOut className="h-4 w-4" />
                </Button>
            </div>

            <Card className="shadow-lg border-t-4 border-t-orange-500">
                <CardHeader className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <PlusCircle className="h-6 w-6 text-orange-600" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-gray-800">
                            {isEdit ? "Editar Solicitação" : "Nova Solicitação de Reembolso"}
                        </CardTitle>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Preencha os detalhes da despesa para processar o seu reembolso.
                    </p>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                        <div className="space-y-2">
                            <Label htmlFor="descricao" className="font-semibold text-gray-700">Descrição da Despesa</Label>
                            <TextArea
                                id="descricao"
                                placeholder="Ex: Almoço com cliente X durante evento em SP..."
                                className="focus:ring-orange-500 border-gray-300"
                                {...register("descricao")}
                                error={errors.descricao?.message}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            <div className="space-y-2">
                                <Label htmlFor="valor" className="font-semibold text-gray-700">Valor (R$)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-gray-500 text-sm">R$</span>
                                    <Input
                                        id="valor"
                                        type="number"
                                        step="0.01"
                                        placeholder="0,00"
                                        className="pl-9 focus:ring-orange-500 border-gray-300"
                                        {...register("valor", { valueAsNumber: true })}
                                    />
                                </div>
                                {errors.valor && <span className="text-xs text-red-500 font-medium">{errors.valor.message}</span>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="dataDespesa" className="font-semibold text-gray-700">Data da Despesa</Label>
                                <Input
                                    id="dataDespesa"
                                    type="date"
                                    className="focus:ring-orange-500 border-gray-300 text-gray-700"
                                    {...register("dataDespesa")}
                                />
                                {errors.dataDespesa && <span className="text-xs text-red-500 font-medium">{errors.dataDespesa.message}</span>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="font-semibold text-gray-700">Categoria</Label>
                            <Select
                                value={watch("categoriaId")}
                                onValueChange={(value: string) => setValue("categoriaId", value)}
                            >
                                <SelectTrigger className="focus:ring-orange-500 border-gray-300">
                                    <SelectValue placeholder="Selecione a categoria da despesa" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categorias.map((cat) => (
                                        <SelectItem
                                            key={cat.id}
                                            value={cat.id}
                                            disabled={!cat.ativo}
                                        >
                                            {cat.ativo ? cat.nome : `${cat.nome} (Indisponível)`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.categoriaId && <span className="text-xs text-red-500 font-medium">{errors.categoriaId.message}</span>}
                        </div>

                        <div className="pt-6 flex justify-end gap-3 border-t border-gray-100">
                            <Button
                                type="button"
                                variant="outline"
                                className="border-gray-300 hover:bg-gray-50 text-gray-600"
                                onClick={() => navigate("/dashboard")}
                            >
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="bg-orange-500 hover:bg-orange-600 text-white shadow-md transition-all px-8"
                            >
                                {loading ? (
                                    <Loader2 className="animate-spin mr-2 h-4 w-4" />
                                ) : (
                                    <Save className="mr-2 h-4 w-4" />
                                )}
                                {isEdit ? "Salvar Alterações" : "Salvar Solicitação"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}