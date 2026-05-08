import { z } from 'zod';

export const loginSchema = z.object({
    email: z
        .string()
        .min(1, "E-mail é obrigatório")
        .email("Formato de e-mail inválido"),

    senha: z
        .string()
        .min(1, "Senha é obrigatória")
        .min(6, "A senha deve ter pelo menos 6 caracteres")
});

export const cadastroSchema = z.object({
    nome: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
    email: z.string().email("E-mail inválido"),
    senha: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
    perfil: z.enum(['COLABORADOR', 'GESTOR', 'FINANCEIRO', 'ADMIN']).optional()
});

export type LoginInput = z.infer<typeof loginSchema>;
export type CadastroInput = z.infer<typeof cadastroSchema>;