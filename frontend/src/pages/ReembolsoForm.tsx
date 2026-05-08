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
import { ArrowLeft, Loader2, Save, LogOut, PlusCircle, Paperclip } from "lucide-react";
import { toast } from "sonner";

export default function ReembolsoForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [categorias, setCategorias] = useState<any[]>([]);
    const isEdit = Boolean(id);
    const { signOut } = useAuth();
    const [arquivo, setArquivo] = useState<File | null>(null);

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
                const allCategories = resCat.data;

                if (isEdit) {
                    const resReembolso = await api.get(`/reembolsos/${id}`);
                    const data = resReembolso.data;

                    if (data.status !== 'DRAFT') {
                        toast.error("Apenas rascunhos podem ser editados!");
                        return navigate("/dashboard");
                    }

                    // AJUSTE AQUI: Filtra por c.ativo (booleano)
                    const catsParaEdicao = allCategories.filter((c: any) =>
                        c.ativo === true || c.id === data.categoriaId
                    );
                    setCategorias(catsParaEdicao);

                    reset({
                        descricao: data.descricao,
                        valor: Number(data.valor),
                        dataDespesa: data.dataDespesa.split('T')[0],
                        categoriaId: data.categoriaId
                    });
                } else {
                    // AJUSTE AQUI: Filtra por c.ativo === true
                    const apenasAtivas = allCategories.filter((c: any) => c.ativo === true);
                    setCategorias(apenasAtivas);
                }

            } catch (err) {
                toast.error("Erro ao carregar dados.");
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [id, isEdit, reset, navigate]);

    const onSubmit = async (values: any) => {
        try {
            setLoading(true);

            const formData = new FormData();

            // Verifique se o seu backend espera os dados soltos ou dentro de um objeto
            // Tentaremos o padrão "solto" que é o mais comum para Multer:
            formData.append("descricao", values.descricao);
            formData.append("valor", String(values.valor));
            formData.append("dataDespesa", values.dataDespesa);
            formData.append("categoriaId", values.categoriaId);

            if (arquivo) {
                // MUITO IMPORTANTE: Tente 'file' ou 'anexo'
                // Se o erro persistir, mude para o nome que está no seu schema do Zod no BACKEND
                formData.append("file", arquivo);
            }

            // Deixe o Axios configurar os headers automaticamente
            await api.post("/reembolsos", formData);

            toast.success("Solicitação criada!");
            navigate("/dashboard");
        } catch (err: any) {
            console.error("ERRO:", err.response?.data);
            toast.error("Erro de validação. Verifique os campos.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto min-h-screen bg-slate-50">
            <div className="flex justify-between items-center mb-4">
                <Button
                    variant="ghost"
                    className="text-gray-600 hover:text-orange-600 transition-colors"
                    onClick={() => navigate("/dashboard")}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
                </Button>
                <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="text-red-500 hover:text-red-700"
                >
                    <LogOut className="h-4 w-4 mr-2" /> Sair
                </Button>
            </div>

            <Card className="shadow-lg border-t-4 border-t-orange-500">
                <CardHeader className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                            <PlusCircle className="h-6 w-6 text-orange-600" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-gray-800">
                            {isEdit ? "Editar Solicitação" : "Nova Solicitação"}
                        </CardTitle>
                    </div>
                </CardHeader>

                <CardContent>
                    {loading && isEdit ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="animate-spin text-orange-500 h-8 w-8" />
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="descricao">Descrição</Label>
                                <TextArea
                                    id="descricao"
                                    placeholder="Ex: Almoço com cliente..."
                                    className="focus:ring-orange-500"
                                    {...register("descricao")}
                                />
                                {errors.descricao && <span className="text-xs text-red-500">{errors.descricao.message as string}</span>}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="valor">Valor (R$)</Label>
                                    <Input
                                        id="valor"
                                        type="number"
                                        step="0.01"
                                        {...register("valor", { valueAsNumber: true })}
                                    />
                                    {errors.valor && <span className="text-xs text-red-500">{errors.valor.message as string}</span>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="dataDespesa">Data</Label>
                                    <Input
                                        id="dataDespesa"
                                        type="date"
                                        {...register("dataDespesa")}
                                    />
                                    {errors.dataDespesa && <span className="text-xs text-red-500">{errors.dataDespesa.message as string}</span>}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Categoria</Label>
                                <Select
                                    value={watch("categoriaId")}
                                    onValueChange={(value: string) => setValue("categoriaId", value)}
                                >

                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecione a categoria" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {categorias.length === 0 && (
                                            <div className="p-2 text-sm text-center text-muted-foreground">Nenhuma categoria ativa</div>
                                        )}
                                        {categorias.map((cat) => (
                                            <SelectItem
                                                key={cat.id}
                                                value={cat.id}
                                                disabled={!cat.ativo && !isEdit} // Desabilita se inativa, exceto se já estiver salva
                                            >
                                                {cat.nome} {!cat.ativo && "(Inativa)"}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <div className="space-y-2">
                                    <Label className="font-semibold">Comprovante (Imagem ou PDF)</Label>
                                    <div
                                        className={`border-2 border-dashed rounded-lg p-4 transition-colors ${arquivo ? "border-green-500 bg-green-50" : "border-gray-300 hover:bg-slate-100"
                                            }`}
                                    >
                                        <input
                                            type="file"
                                            id="file-upload"
                                            className="hidden"
                                            accept=".png,.jpg,.jpeg,.pdf"
                                            onChange={(e) => {
                                                if (e.target.files?.[0]) setArquivo(e.target.files[0]);
                                            }}
                                        />
                                        <label
                                            htmlFor="file-upload"
                                            className="flex flex-col items-center cursor-pointer gap-2"
                                        >
                                            <Paperclip className={`h-6 w-6 ${arquivo ? "text-green-600" : "text-slate-400"}`} />
                                            <span className="text-sm font-medium text-slate-600">
                                                {arquivo ? arquivo.name : "Clique para anexar o recibo"}
                                            </span>
                                            {arquivo && (
                                                <span className="text-xs text-green-600">Arquivo pronto para envio</span>
                                            )}
                                        </label>
                                    </div>
                                </div>
                                {errors.categoriaId && <span className="text-xs text-red-500">{errors.categoriaId.message as string}</span>}
                            </div>

                            <div className="pt-6 flex justify-end gap-3 border-t">
                                <Button type="button" variant="outline" onClick={() => navigate("/dashboard")}>
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={loading} className="bg-orange-500 hover:bg-orange-600">
                                    {loading ? <Loader2 className="animate-spin h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                                    {isEdit ? "Salvar Alterações" : "Salvar Solicitação"}
                                </Button>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}