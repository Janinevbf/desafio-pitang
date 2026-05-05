import { z } from 'zod';

export const criarCategoriaSchema = z.object({
    nome: z.string().min(1, "Nome é obrigatório"),
    ativo: z.boolean().optional().default(true)
});

export const atualizarCategoriaSchema = z.object({
    nome: z.string().min(1, "Nome é obrigatório").optional(),
    ativo: z.boolean().optional()
});

export type CriarCategoriaInput = z.infer<typeof criarCategoriaSchema>;
export type AtualizarCategoriaInput = z.infer<typeof atualizarCategoriaSchema>;
