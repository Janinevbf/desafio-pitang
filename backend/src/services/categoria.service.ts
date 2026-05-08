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
                ativo: data.ativo ?? true,
            },
        });
    }

    async findAll() {

        return await prisma.categoria.findMany({
            orderBy: { nome: 'asc' },
        });
    }


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

    async inactivate(id: string) {
        const existing = await prisma.categoria.findUnique({ where: { id } });

        if (!existing) {
            throw new AppError('Categoria não encontrada', 404);
        }

        return await prisma.categoria.update({
            where: { id },
            data: { ativo: false },
        });
    }
}