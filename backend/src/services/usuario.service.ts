import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { AppError } from '../errors/AppError';

const prisma = new PrismaClient();

export class UsuarioService {
    async listarTodos() {
        return await prisma.user.findMany({
            select: {
                id: true,
                nome: true,
                email: true,
                perfil: true,
                criadoEm: true,
                atualizadoEm: true
            },
            orderBy: { criadoEm: 'asc' }
        });
    }

    async buscarPorId(id: string) {
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                nome: true,
                email: true,
                perfil: true,
                criadoEm: true,
                atualizadoEm: true
            }
        });

        if (!user) throw new AppError("Usuário não encontrado", 404);
        return user;
    }

    async criar(data: { nome: string; email: string; senha: string; perfil: string }) {
        const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
        if (existingUser) throw new AppError("E-mail já cadastrado", 400);

        const senhaHash = await bcrypt.hash(data.senha, 12);

        return await prisma.user.create({
            data: {
                nome: data.nome,
                email: data.email,
                senha: senhaHash,
                perfil: data.perfil
            },
            select: {
                id: true,
                nome: true,
                email: true,
                perfil: true,
                criadoEm: true,
                atualizadoEm: true
            }
        });
    }

    async editar(id: string, data: { nome?: string; email?: string; senha?: string; perfil?: string }) {
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) throw new AppError("Usuário não encontrado", 404);

        if (data.email) {
            const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
            if (existingUser && existingUser.id !== id) {
                throw new AppError("E-mail já cadastrado", 400);
            }
        }

        const updateData: any = {};
        if (data.nome) updateData.nome = data.nome;
        if (data.email) updateData.email = data.email;
        if (data.perfil) updateData.perfil = data.perfil;
        if (data.senha) updateData.senha = await bcrypt.hash(data.senha, 12);

        return await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                nome: true,
                email: true,
                perfil: true,
                criadoEm: true,
                atualizadoEm: true
            }
        });
    }

    async deletar(id: string) {
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) throw new AppError("Usuário não encontrado", 404);

        return await prisma.user.delete({ where: { id } });
    }
}
