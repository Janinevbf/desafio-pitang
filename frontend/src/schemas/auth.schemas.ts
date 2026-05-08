import { z } from 'zod';

export const cadastroSchema = z.object({
    nome: z.string().min(3, "O nome deve ter pelo menos 3 caracteres"),
    email: z.string().email("E-mail inválido"),
    senha: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
    confirmarSenha: z.string().min(1, "Confirmação de senha é obrigatória"),
    perfil: z.enum(["COLABORADOR", "GESTOR", "FINANCEIRO", "ADMIN"]).optional(),
}).refine((data) => data.senha === data.confirmarSenha, {
    message: "As senhas não conferem",
    path: ["confirmarSenha"],
});
