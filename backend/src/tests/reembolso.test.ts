import { app } from '../app';
import request from 'supertest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Fluxo Completo de Reembolso (Regras 10.x)', () => {
    let tokenColaborador: string = '';
    let tokenGestor: string = '';
    let solicitacaoId: string = '';
    const CATEGORIA_ID = "550e8400-e29b-41d4-a716-446655440000";

    beforeAll(async () => {
        // 1. Limpeza (Ajustado de 'usuario' para 'user')
        await prisma.historico.deleteMany();
        await prisma.anexo.deleteMany();
        await prisma.solicitacao.deleteMany();
        await prisma.categoria.deleteMany();
        await prisma.user.deleteMany(); // Mudança aqui

        // 2. Setup de Categoria (Ajustado de 'ativa' para 'ativo' conforme sugestão do erro)
        await prisma.categoria.create({
            data: {
                id: CATEGORIA_ID,
                nome: 'Viagem',
                ativo: true // Mudança aqui de 'ativa' para 'ativo'
            }
        });

        // 3. Setup de Usuários (Ajustado para 'user')
        const bcrypt = require('bcrypt');
        const senhaHash = await bcrypt.hash('password123', 10);

        await prisma.user.createMany({ // Mudança aqui
            data: [
                { nome: 'João Colab', email: 'joao@test.com', senha: senhaHash, perfil: 'COLABORADOR' },
                { nome: 'Maria Gestora', email: 'maria@test.com', senha: senhaHash, perfil: 'GESTOR' }
            ]
        });

        // 3. Obter Tokens
        const loginColab = await request(app).post('/auth/login').send({ email: 'joao@test.com', senha: 'password123' });
        tokenColaborador = loginColab.body.token;

        const loginGestor = await request(app).post('/auth/login').send({ email: 'maria@test.com', senha: 'password123' });
        tokenGestor = loginGestor.body.token;
    });

    it('1. Deve criar como RASCUNHO (Status: DRAFT)', async () => {
        const res = await request(app)
            .post('/reembolsos')
            .set('Authorization', `Bearer ${tokenColaborador}`)
            .send({
                nome: 'Uber',
                valor: 50.00,
                categoriaId: CATEGORIA_ID,
                descricao: 'Visita a cliente',
                dataDespesa: new Date().toISOString()
            });

        expect(res.status).toBe(201);
        expect(res.body.status).toBe('DRAFT'); // Regra 10.2
        solicitacaoId = res.body.id;
    });

    it('1.2. Deve permitir editar um RASCUNHO', async () => {
        const res = await request(app)
            .put(`/reembolsos/${solicitacaoId}`)
            .set('Authorization', `Bearer ${tokenColaborador}`)
            .send({
                valor: 75.00
            });

        expect(res.status).toBe(200);
        expect(Number(res.body.resultado.valor)).toBe(75.00);
    });

    it('1.5. Deve permitir cancelar um RASCUNHO', async () => {
        // Criar um novo rascunho apenas para testar o cancelamento
        const createRes = await request(app)
            .post('/reembolsos')
            .set('Authorization', `Bearer ${tokenColaborador}`)
            .send({
                nome: 'Almoço',
                valor: 35.00,
                categoriaId: CATEGORIA_ID,
                dataDespesa: new Date().toISOString()
            });

        const tempId = createRes.body.id;

        const cancelRes = await request(app)
            .patch(`/reembolsos/${tempId}/cancelar`)
            .set('Authorization', `Bearer ${tokenColaborador}`);

        expect(cancelRes.status).toBe(200);
        expect(cancelRes.body.resultado.status).toBe('CANCELED');
    });

    it('2. Não deve permitir aprovar um RASCUNHO', async () => {
        const res = await request(app)
            .patch(`/reembolsos/${solicitacaoId}/avaliar`)
            .set('Authorization', `Bearer ${tokenGestor}`)
            .send({ status: 'APROVADO' });

        expect(res.status).toBe(400); // Regra 10.4: Apenas ENVIADO pode ser aprovado
    });

    it('3. Deve enviar para análise (Status: SUBMITTED)', async () => {
        const res = await request(app)
            .post(`/reembolsos/${solicitacaoId}/enviar`)
            .set('Authorization', `Bearer ${tokenColaborador}`);

        expect(res.status).toBe(200);
        expect(res.body.status).toBe('SUBMITTED'); // Regra 10.3
    });

    it('3.5. Não deve permitir editar um reembolso ENVIADO', async () => {
        const res = await request(app)
            .put(`/reembolsos/${solicitacaoId}`)
            .set('Authorization', `Bearer ${tokenColaborador}`)
            .send({ valor: 100.00 });

        expect(res.status).toBe(400); // Bloqueado pois não é mais DRAFT
    });

    it('4. Deve permitir que o gestor aprove (Status: APPROVED)', async () => {
        const res = await request(app)
            .patch(`/reembolsos/${solicitacaoId}/avaliar`)
            .set('Authorization', `Bearer ${tokenGestor}`)
            .send({ status: 'APROVADO' });

        expect(res.status).toBe(200);
        expect(res.body.resultado.status).toBe('APPROVED'); // Regra 10.4
    });

    it('5. Deve validar o histórico completo', async () => {
        const res = await request(app)
            .get(`/reembolsos/${solicitacaoId}/historico`)
            .set('Authorization', `Bearer ${tokenColaborador}`);

        const acoes = res.body.map((h: any) => h.acao);
        expect(acoes).toContain('CREATED');
        expect(acoes).toContain('SUBMITTED');
        expect(acoes).toContain('APPROVED');
    });
});