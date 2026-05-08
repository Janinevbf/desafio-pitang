import { z } from 'zod';


export const criarReembolsoSchema = z.object({
    nome: z.string().optional(),
    valor: z.number().positive("O valor deve ser maior que zero"),
    categoriaId: z.string().uuid("ID da categoria inválido"),
    descricao: z.string().min(3, "A descrição deve ter pelo menos 3 caracteres"),
    anexoUrl: z.string().optional(),
    dataDespesa: z.string().regex(/^\d{4}-\d{2}-\d{2}/, "Data da despesa inválida")
});