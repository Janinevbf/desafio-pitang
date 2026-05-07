import { z } from 'zod';

export const criarUsuarioSchema = z.object({
    nome: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
    email: z.string().email("E-mail inválido"),
    senha: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
    perfil: z.enum(['COLABORADOR', 'GESTOR', 'FINANCEIRO'])
});

export const editarUsuarioSchema = z.object({
    nome: z.string().min(3, "O nome deve ter pelo menos 3 caracteres").optional(),
    email: z.string().email("E-mail inválido").optional(),
    senha: z.string().min(6, "A senha deve ter pelo menos 6 caracteres").optional(),
    perfil: z.enum(['COLABORADOR', 'GESTOR', 'FINANCEIRO', 'ADMIN']).optional()
});

export const criarReembolsoSchema = z.object({
    descricao: z.string().min(3, "Descrição é obrigatória"), // Mude de 'nome' para 'descricao'
    valor: z.number().positive("O valor deve ser positivo"),
    dataDespesa: z.string(), // Ou z.date() dependendo da sua config
    categoriaId: z.string().uuid("Categoria inválida"),
});

export type CriarUsuarioInput = z.infer<typeof criarUsuarioSchema>;
export type EditarUsuarioInput = z.infer<typeof editarUsuarioSchema>;
