import { z } from 'zod';

export const criarReembolsoSchema = z.object({
    nome: z.string().min(3, "O nome deve ter pelo menos  3 caracteres"),
    valor: z.number().positive("O valor deve ser maior que zero"),
    categoriaId: z.string().uuid("ID da categoria inválido"),
    descricao: z.string().optional(),
    anexoUrl: z.string().url().regex(/\.(png|jpe?g|pdf)$/i, "Apenas anexos PNG, JPG ou PDF são permitidos").optional(),
    dataDespesa: z.string().datetime("Data da despesa inválida")
});

export const avaliarReembolsoSchema = z.object({
    status: z.enum(['APROVADO', 'REJEITADO'], {
        message: "Status inválido. Use APROVADO ou REJEITADO."
    }),
    justificativa: z.string().optional()
});

export const editarReembolsoSchema = criarReembolsoSchema.partial();