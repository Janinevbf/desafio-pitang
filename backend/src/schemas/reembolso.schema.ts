import { z } from 'zod';

export const criarReembolsoSchema = z.object({
    nome: z.string().optional(),
    valor: z.coerce.number().positive("O valor deve ser maior que zero"),
    categoriaId: z.string().uuid("ID da categoria inválido"),
    descricao: z.string().min(3, "A descrição deve ter pelo menos 3 caracteres"),
    anexoUrl: z.string().optional(),
    dataDespesa: z.string().regex(/^\d{4}-\d{2}-\d{2}/, "Data da despesa inválida")
});

export const avaliarReembolsoSchema = z.object({
    status: z.enum(['APROVADO', 'REJEITADO'], {
        message: "Status inválido. Use APROVADO ou REJEITADO."
    }),
    justificativa: z.string().optional()
});

export const editarReembolsoSchema = criarReembolsoSchema.partial();