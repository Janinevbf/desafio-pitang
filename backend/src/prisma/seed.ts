import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { hash } from 'node:crypto';

const prisma = new PrismaClient();

async function main() {
    const senhaHash = await bcrypt.hash('pitang123', 10);

    // Criando Categorias
    // Criando Categorias uma por uma para evitar erros no SQLite
    await prisma.categoria.create({ data: { nome: 'Transporte' } });
    await prisma.categoria.create({ data: { nome: 'Alimentação' } });
    await prisma.categoria.create({ data: { nome: 'Hospedagem' } });

    // Criando Usuários para cada perfil do desafio
    await prisma.user.create({
        data: {
            nome: 'Carlos Colaborador',
            email: 'colaborador@test.com',
            senha: senhaHash,
            perfil: 'COLABORADOR'
        }
    });

    await prisma.user.create({
        data: {
            nome: 'Gisele Gestora',
            email: 'gestor@test.com',
            senha: senhaHash,
            perfil: 'GESTOR'
        }
    });


    console.log('Seed executado: Usuários e Categorias criados!');
}

main()
    .then(async () => {
        await prisma.$disconnect();
        console.log('Seed finalizado com sucesso!');
    })
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });