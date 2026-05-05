import request from 'supertest';
import { app } from '../app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Auth Flow', () => {
    beforeAll(async () => {
        const bcrypt = require('bcrypt');
        const senhaHash = await bcrypt.hash('pitang123', 10);

        await prisma.user.upsert({
            where: { email: 'gestor@test.com' },
            update: {},
            create: {
                nome: 'Gisele Gestora',
                email: 'gestor@test.com',
                senha: senhaHash,
                perfil: 'GESTOR'
            }
        });
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    it('Deve retornar 200 e um token ao fazer login com credenciais válidas', async () => {
        const response = await request(app)
            .post('/auth/login')
            .send({
                email: 'gestor@test.com',
                senha: 'pitang123'
            });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('token');
        expect(response.body.user).toHaveProperty('perfil', 'GESTOR');
    });

    it('Deve retornar 401 ao tentar login com senha errada', async () => {
        const response = await request(app)
            .post('/auth/login')
            .send({
                email: 'gestor@test.com',
                senha: 'senha_errada'
            });

        expect(response.status).toBe(401);
        expect(response.body).toHaveProperty('error');
    });

    it('Deve retornar 401 ao tentar login com email inexistente', async () => {
        const response = await request(app)
            .post('/auth/login')
            .send({
                email: 'inexistente@test.com',
                senha: 'pitang123'
            });

        expect(response.status).toBe(401);
    });

    it('Deve retornar 400 ao tentar login com campos vazios', async () => {
        const response = await request(app)
            .post('/auth/login')
            .send({ email: '', senha: '' });

        expect(response.status).toBe(400);
    });

    it('Deve retornar 400 ao tentar login com email inválido', async () => {
        const response = await request(app)
            .post('/auth/login')
            .send({
                email: 'email-invalido',
                senha: 'pitang123'
            });

        expect(response.status).toBe(400);
    });

    it('Deve cadastrar um novo usuário com sucesso', async () => {
        const response = await request(app)
            .post('/auth/cadastro')
            .send({
                nome: 'Teste Usuario',
                email: `teste.${Date.now()}@test.com`,
                senha: 'password123',
                perfil: 'COLABORADOR'
            });

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('token');
        expect(response.body.user).toHaveProperty('nome', 'Teste Usuario');
    });

    it('Deve retornar 409 ao cadastrar email duplicado', async () => {
        const emailUnico = `duplicado.${Date.now()}@test.com`;

        await request(app)
            .post('/auth/cadastro')
            .send({
                nome: 'Usuario Duplicado',
                email: emailUnico,
                senha: 'password123'
            });

        const response = await request(app)
            .post('/auth/cadastro')
            .send({
                nome: 'Outro Usuario',
                email: emailUnico,
                senha: 'password456'
            });

        expect(response.status).toBe(409);
    });

    it('Deve retornar 400 ao cadastrar com senha menor que 6 caracteres', async () => {
        const response = await request(app)
            .post('/auth/cadastro')
            .send({
                nome: 'Usuario Senha Curta',
                email: `senha.curta.${Date.now()}@test.com`,
                senha: '12345'
            });

        expect(response.status).toBe(400);
    });
});
