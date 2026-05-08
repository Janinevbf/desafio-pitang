import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { hash } from 'node:crypto';

const prisma = new PrismaClient();

async function main() {
    const senhaHash = await bcrypt.hash('pitang123', 10);

    await prisma.solicitacao.deleteMany();
    await prisma.anexo.deleteMany();
    await prisma.historico.deleteMany();
    await prisma.user.deleteMany();
    await prisma.categoria.deleteMany();

    await prisma.categoria.create({ data: { nome: 'Transporte' } });
    await prisma.categoria.create({ data: { nome: 'Alimentação' } });
    await prisma.categoria.create({ data: { nome: 'Hospedagem' } });


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

    await prisma.user.create({
        data: {
            nome: 'Fernando Financeiro',
            email: 'financeiro@test.com',
            senha: senhaHash,
            perfil: 'FINANCEIRO'
        }
    });

    await prisma.user.create({
        data: {
            nome: 'Ana Administradora',
            email: 'admin@test.com',
            senha: senhaHash,
            perfil: 'ADMIN'
        }
    });

    console.log('Seed executado: Usuários (COLABORADOR, GESTOR, FINANCEIRO, ADMIN) e Categorias criados!');
}

main()
    .then(async () => {
        await prisma.$disconnect();
        console.log('Seed finalizado com sucesso!');
    })
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); });