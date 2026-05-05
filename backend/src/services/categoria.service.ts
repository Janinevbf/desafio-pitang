import { PrismaClient } from '@prisma/client';
import { AppError } from '../errors/AppError';
import { CriarCategoriaInput, AtualizarCategoriaInput } from '../schemas/categoria.schema';

const prisma = new PrismaClient();

export class CategoriaService {
    async create(data: CriarCategoriaInput) {
        return await prisma.categoria.create({
            data: {
                nome: data.nome,
                ativo: data.ativo,
            },
        });
    }

    async findAll() {
        return await prisma.categoria.findMany({
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

        return await prisma.categoria.update({
            where: { id },
            data: {
                nome: data.nome !== undefined ? data.nome : existing.nome,
                ativo: data.ativo !== undefined ? data.ativo : existing.ativo,
            },
        });
    }

    async delete(id: string) {
        const existing = await prisma.categoria.findUnique({
            where: { id },
            include: { solicitacoes: true },
        });
        if (!existing) {
            throw new AppError('Categoria não encontrada', 404);
        }

        if (existing.solicitacoes.length > 0) {
            throw new AppError('Não é possível excluir categoria vinculada a solicitações', 409);
        }

        await prisma.categoria.delete({
            where: { id },
        });
    }
}
