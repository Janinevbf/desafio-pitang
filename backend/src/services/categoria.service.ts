import { PrismaClient } from '@prisma/client';
import { AppError } from '../errors/AppError';
import { CriarCategoriaInput, AtualizarCategoriaInput } from '../schemas/categoria.schema';

const prisma = new PrismaClient();

export class CategoriaService {
    async create(data: CriarCategoriaInput) {
        const existe = await prisma.categoria.findFirst({
            where: { nome: { equals: data.nome } }
        });

        if (existe) {
            throw new AppError('Já existe uma categoria com este nome', 400);
        }

        return await prisma.categoria.create({
            data: {
                nome: data.nome,
                ativo: data.ativo ?? true, // Garante que nasce ativa se não enviado
            },
        });
    }

    async findAll() {
        // Admin vê tudo, mas ordenado para facilitar a gestão
        return await prisma.categoria.findMany({
            orderBy: { nome: 'asc' },
        });
    }

    // Método adicional útil para o Dropdown do Colaborador
    async findAtivas() {
        return await prisma.categoria.findMany({
            where: { ativo: true },
            orderBy: { nome: 'asc' },
        });
    }

    async findById(id: string) {
        const categoria = await prisma.categoria.findUnique({
            where: { id },
        });
        if (!categoria) {
            throw new AppError('Categoria não encontrada', 404);
        }
        return categoria;
    }

    async update(id: string, data: AtualizarCategoriaInput) {
        const existing = await prisma.categoria.findUnique({ where: { id } });
        if (!existing) {
            throw new AppError('Categoria não encontrada', 404);
        }

        if (data.nome && data.nome.toLowerCase() !== existing.nome.toLowerCase()) {
            const nomeEmUso = await prisma.categoria.findFirst({
                where: {
                    nome: { equals: data.nome },
                    id: { not: id }
                }
            });
            if (nomeEmUso) throw new AppError('Este nome de categoria já está em uso', 400);
        }

        return await prisma.categoria.update({
            where: { id },
            data: {
                nome: data.nome ?? existing.nome,
                ativo: data.ativo !== undefined ? data.ativo : existing.ativo,
            },
        });
    }

    async delete(id: string) {
        const existing = await prisma.categoria.findUnique({
            where: { id },
            include: { _count: { select: { solicitacoes: true } } },
        });

        if (!existing) {
            throw new AppError('Categoria não encontrada', 404);
        }

        // Bloqueio de exclusão se houver qualquer vínculo histórico
        if (existing._count.solicitacoes > 0) {
            throw new AppError(
                'Não é possível excluir. Inative a categoria para que ela não apareça em novos reembolsos.',
                409
            );
        }

        await prisma.categoria.delete({ where: { id } });
    }
}