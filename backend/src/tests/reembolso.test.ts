import request from 'supertest';
import { app } from '../app';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Fluxo Completo de Reembolso', () => {
    let tokenColaborador: string = '';
    let tokenGestor: string = '';
    let tokenFinanceiro: string = '';
    let tokenAdmin: string = '';
    let solicitacaoId: string = '';
    let categoriaId: string = '';

    beforeAll(async () => {
        await prisma.historico.deleteMany();
        await prisma.anexo.deleteMany();
        await prisma.solicitacao.deleteMany();
        await prisma.categoria.deleteMany();
        await prisma.user.deleteMany();

        const bcrypt = require('bcrypt');
        const senhaHash = await bcrypt.hash('password123', 10);

        await prisma.user.createMany({
            data: [
                { nome: 'João Colab', email: 'joao@test.com', senha: senhaHash, perfil: 'COLABORADOR' },
                { nome: 'Maria Gestora', email: 'maria@test.com', senha: senhaHash, perfil: 'GESTOR' },
                { nome: 'Fernando Financeiro', email: 'fernando@test.com', senha: senhaHash, perfil: 'FINANCEIRO' },
                { nome: 'Ana Admin', email: 'ana@test.com', senha: senhaHash, perfil: 'ADMIN' }
            ]
        });

        const categoria = await prisma.categoria.create({
            data: { nome: 'Transporte', ativo: true }
        });
        categoriaId = categoria.id;

        const loginColab = await request(app).post('/auth/login').send({ email: 'joao@test.com', senha: 'password123' });
        tokenColaborador = loginColab.body.token;

        const loginGestor = await request(app).post('/auth/login').send({ email: 'maria@test.com', senha: 'password123' });
        tokenGestor = loginGestor.body.token;

        const loginFinanceiro = await request(app).post('/auth/login').send({ email: 'fernando@test.com', senha: 'password123' });
        tokenFinanceiro = loginFinanceiro.body.token;

        const loginAdmin = await request(app).post('/auth/login').send({ email: 'ana@test.com', senha: 'password123' });
        tokenAdmin = loginAdmin.body.token;
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    describe('Categorias (ADMIN)', () => {
        let novaCategoriaId: string = '';

        it('Deve criar categoria como ADMIN', async () => {
            const res = await request(app)
                .post('/categorias')
                .set('Authorization', `Bearer ${tokenAdmin}`)
                .send({ nome: 'Hospedagem' });

            expect(res.status).toBe(201);
            expect(res.body.nome).toBe('Hospedagem');
            expect(res.body.ativo).toBe(true);
            novaCategoriaId = res.body.id;
        });

        it('Deve listar todas as categorias', async () => {
            const res = await request(app)
                .get('/categorias')
                .set('Authorization', `Bearer ${tokenColaborador}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
        });

        it('Deve buscar categoria por ID', async () => {
            const res = await request(app)
                .get(`/categorias/${novaCategoriaId}`)
                .set('Authorization', `Bearer ${tokenColaborador}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('nome');
        });

        it('Deve atualizar categoria como ADMIN', async () => {
            const res = await request(app)
                .put(`/categorias/${novaCategoriaId}`)
                .set('Authorization', `Bearer ${tokenAdmin}`)
                .send({ nome: 'Hospedagem Internacional' });

            expect(res.status).toBe(200);
            expect(res.body.nome).toBe('Hospedagem Internacional');
        });

        it('Deve desativar categoria como ADMIN', async () => {
            const res = await request(app)
                .put(`/categorias/${novaCategoriaId}`)
                .set('Authorization', `Bearer ${tokenAdmin}`)
                .send({ ativo: false });

            expect(res.status).toBe(200);
            expect(res.body.ativo).toBe(false);
        });

        it('Deve retornar 403 ao tentar criar categoria sem ser ADMIN', async () => {
            const res = await request(app)
                .post('/categorias')
                .set('Authorization', `Bearer ${tokenColaborador}`)
                .send({ nome: 'Categoria Proibida' });

            expect(res.status).toBe(403);
        });

        it('Deve retornar 400 ao tentar criar reembolso com categoria inativa', async () => {
            const res = await request(app)
                .post('/reembolsos')
                .set('Authorization', `Bearer ${tokenColaborador}`)
                .send({
                    nome: 'Teste Categoria Inativa',
                    valor: 100.00,
                    categoriaId: novaCategoriaId,
                    dataDespesa: new Date().toISOString()
                });

            expect(res.status).toBe(400);
            expect(res.body.error).toContain('inativa');
        });

        it('Deve deletar categoria como ADMIN', async () => {
            const res = await request(app)
                .delete(`/categorias/${novaCategoriaId}`)
                .set('Authorization', `Bearer ${tokenAdmin}`);

            expect(res.status).toBe(204);
        });
    });

    describe('Fluxo de Reembolso', () => {
        it('Deve criar reembolso como RASCUNHO (DRAFT)', async () => {
            const res = await request(app)
                .post('/reembolsos')
                .set('Authorization', `Bearer ${tokenColaborador}`)
                .send({
                    nome: 'Uber para aeroporto',
                    valor: 85.50,
                    categoriaId,
                    descricao: 'Corrida de uber',
                    dataDespesa: new Date().toISOString(),
                    anexoUrl: 'https://exemplo.com/comprovante.png'
                });

            expect(res.status).toBe(201);
            expect(res.body.status).toBe('DRAFT');
            expect(res.body).toHaveProperty('anexos');
            expect(res.body.anexos.length).toBe(1);
            solicitacaoId = res.body.id;
        });

        it('Deve retornar 400 ao criar reembolso com valor zero', async () => {
            const res = await request(app)
                .post('/reembolsos')
                .set('Authorization', `Bearer ${tokenColaborador}`)
                .send({
                    nome: 'Teste valor zero',
                    valor: 0,
                    categoriaId,
                    dataDespesa: new Date().toISOString()
                });

            expect(res.status).toBe(400);
        });

        it('Deve permitir editar um RASCUNHO', async () => {
            const res = await request(app)
                .put(`/reembolsos/${solicitacaoId}`)
                .set('Authorization', `Bearer ${tokenColaborador}`)
                .send({ valor: 95.00 });

            expect(res.status).toBe(200);
            expect(Number(res.body.resultado.valor)).toBe(95.00);
        });

        it('Deve permitir cancelar um RASCUNHO', async () => {
            const createRes = await request(app)
                .post('/reembolsos')
                .set('Authorization', `Bearer ${tokenColaborador}`)
                .send({
                    nome: 'Almoço',
                    valor: 45.00,
                    categoriaId,
                    dataDespesa: new Date().toISOString()
                });

            const tempId = createRes.body.id;

            const cancelRes = await request(app)
                .patch(`/reembolsos/${tempId}/cancelar`)
                .set('Authorization', `Bearer ${tokenColaborador}`);

            expect(cancelRes.status).toBe(200);
            expect(cancelRes.body.resultado.status).toBe('CANCELED');
        });

        it('Deve enviar para análise (SUBMITTED)', async () => {
            const res = await request(app)
                .post(`/reembolsos/${solicitacaoId}/enviar`)
                .set('Authorization', `Bearer ${tokenColaborador}`);

            expect(res.status).toBe(200);
            expect(res.body.status).toBe('SUBMITTED');
        });

        it('Não deve permitir editar um reembolso SUBMITTED', async () => {
            const res = await request(app)
                .put(`/reembolsos/${solicitacaoId}`)
                .set('Authorization', `Bearer ${tokenColaborador}`)
                .send({ valor: 200.00 });

            expect(res.status).toBe(400);
        });

        it('Deve permitir que o gestor aprove (APPROVED)', async () => {
            const res = await request(app)
                .patch(`/reembolsos/${solicitacaoId}/avaliar`)
                .set('Authorization', `Bearer ${tokenGestor}`)
                .send({
                    status: 'APROVADO',
                    justificativa: 'Despesa válida e dentro das normas'
                });

            expect(res.status).toBe(200);
            expect(res.body.resultado.status).toBe('APPROVED');
        });

        it('Deve permitir que o financeiro marque como PAGO', async () => {
            const res = await request(app)
                .patch(`/reembolsos/${solicitacaoId}/pagar`)
                .set('Authorization', `Bearer ${tokenFinanceiro}`);

            expect(res.status).toBe(200);
            expect(res.body.resultado.status).toBe('PAID');
        });

        it('Deve validar o histórico completo', async () => {
            const res = await request(app)
                .get(`/reembolsos/${solicitacaoId}/historico`)
                .set('Authorization', `Bearer ${tokenColaborador}`);

            expect(res.status).toBe(200);
            const acoes = res.body.map((h: any) => h.acao);
            expect(acoes).toContain('CREATED');
            expect(acoes).toContain('SUBMITTED');
            expect(acoes).toContain('APPROVED');
            expect(acoes).toContain('PAID');
        });

        it('Deve listar anexos da solicitação', async () => {
            const res = await request(app)
                .get(`/reembolsos/${solicitacaoId}/anexos`)
                .set('Authorization', `Bearer ${tokenColaborador}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBe(1);
        });
    });

    describe('Fluxo de Rejeição', () => {
        let reembolsoRejeitadoId: string = '';

        it('Deve criar e enviar um reembolso para análise', async () => {
            const createRes = await request(app)
                .post('/reembolsos')
                .set('Authorization', `Bearer ${tokenColaborador}`)
                .send({
                    nome: 'Jantar caro',
                    valor: 500.00,
                    categoriaId,
                    dataDespesa: new Date().toISOString()
                });

            reembolsoRejeitadoId = createRes.body.id;

            const sendRes = await request(app)
                .post(`/reembolsos/${reembolsoRejeitadoId}/enviar`)
                .set('Authorization', `Bearer ${tokenColaborador}`);

            expect(sendRes.status).toBe(200);
            expect(sendRes.body.status).toBe('SUBMITTED');
        });

        it('Deve permitir que o gestor rejeite com justificativa obrigatória', async () => {
            const res = await request(app)
                .patch(`/reembolsos/${reembolsoRejeitadoId}/avaliar`)
                .set('Authorization', `Bearer ${tokenGestor}`)
                .send({
                    status: 'REJEITADO',
                    justificativa: 'Valor excede o limite permitido para despesas de alimentação'
                });

            expect(res.status).toBe(200);
            expect(res.body.resultado.status).toBe('REJECTED');
        });

        it('Deve retornar 400 ao tentar rejeitar sem justificativa', async () => {
            const createRes = await request(app)
                .post('/reembolsos')
                .set('Authorization', `Bearer ${tokenColaborador}`)
                .send({
                    nome: 'Outra despesa',
                    valor: 150.00,
                    categoriaId,
                    dataDespesa: new Date().toISOString()
                });

            await request(app)
                .post(`/reembolsos/${createRes.body.id}/enviar`)
                .set('Authorization', `Bearer ${tokenColaborador}`);

            const res = await request(app)
                .patch(`/reembolsos/${createRes.body.id}/avaliar`)
                .set('Authorization', `Bearer ${tokenGestor}`)
                .send({ status: 'REJEITADO' });

            expect(res.status).toBe(400);
            expect(res.body.error).toContain('Justificativa');
        });

        it('Deve registrar a rejeição no histórico', async () => {
            const res = await request(app)
                .get(`/reembolsos/${reembolsoRejeitadoId}/historico`)
                .set('Authorization', `Bearer ${tokenColaborador}`);

            const acoes = res.body.map((h: any) => h.acao);
            expect(acoes).toContain('REJECTED');
        });

        it('Não deve permitir pagar um reembolso REJEITADO', async () => {
            const res = await request(app)
                .patch(`/reembolsos/${reembolsoRejeitadoId}/pagar`)
                .set('Authorization', `Bearer ${tokenFinanceiro}`);

            expect(res.status).toBe(400);
        });

        it('Não deve permitir que o colaborador cancele um reembolso já rejeitado', async () => {
            const res = await request(app)
                .patch(`/reembolsos/${reembolsoRejeitadoId}/cancelar`)
                .set('Authorization', `Bearer ${tokenColaborador}`);

            expect(res.status).toBe(400);
        });
    });

    describe('Fluxo de Pagamento', () => {
        let reembolsoParaPagarId: string = '';

        it('Deve criar, enviar e aprovar um reembolso para pagamento', async () => {
            const createRes = await request(app)
                .post('/reembolsos')
                .set('Authorization', `Bearer ${tokenColaborador}`)
                .send({
                    nome: 'Passagem aérea',
                    valor: 1200.00,
                    categoriaId,
                    dataDespesa: new Date().toISOString()
                });

            reembolsoParaPagarId = createRes.body.id;

            await request(app)
                .post(`/reembolsos/${reembolsoParaPagarId}/enviar`)
                .set('Authorization', `Bearer ${tokenColaborador}`);

            await request(app)
                .patch(`/reembolsos/${reembolsoParaPagarId}/avaliar`)
                .set('Authorization', `Bearer ${tokenGestor}`)
                .send({
                    status: 'APROVADO',
                    justificativa: 'Viagem aprovada pela gerência'
                });
        });

        it('Deve listar reembolsos aprovados para o financeiro', async () => {
            const res = await request(app)
                .get('/reembolsos/aprovados')
                .set('Authorization', `Bearer ${tokenFinanceiro}`);

            expect(res.status).toBe(200);
            expect(Array.isArray(res.body)).toBe(true);

            const ids = res.body.map((r: any) => r.id);
            expect(ids).toContain(reembolsoParaPagarId);
        });

        it('Deve retornar 403 ao tentar acessar aprovados como não-financeiro', async () => {
            const res = await request(app)
                .get('/reembolsos/aprovados')
                .set('Authorization', `Bearer ${tokenColaborador}`);

            expect(res.status).toBe(403);
        });

        it('Deve marcar como PAGO pelo financeiro', async () => {
            const res = await request(app)
                .patch(`/reembolsos/${reembolsoParaPagarId}/pagar`)
                .set('Authorization', `Bearer ${tokenFinanceiro}`);

            expect(res.status).toBe(200);
            expect(res.body.resultado.status).toBe('PAID');
            expect(res.body.message).toContain('sucesso');
        });

        it('Deve retornar 403 ao tentar pagar como não-financeiro', async () => {
            const res = await request(app)
                .patch(`/reembolsos/${reembolsoParaPagarId}/pagar`)
                .set('Authorization', `Bearer ${tokenGestor}`);

            expect(res.status).toBe(403);
        });

        it('Não deve permitir pagar um reembolso já pago', async () => {
            const res = await request(app)
                .patch(`/reembolsos/${reembolsoParaPagarId}/pagar`)
                .set('Authorization', `Bearer ${tokenFinanceiro}`);

            expect(res.status).toBe(400);
        });

        it('Não deve permitir aprovar um reembolso já pago', async () => {
            const res = await request(app)
                .patch(`/reembolsos/${reembolsoParaPagarId}/avaliar`)
                .set('Authorization', `Bearer ${tokenGestor}`)
                .send({ status: 'APROVADO' });

            expect(res.status).toBe(400);
        });
    });

    describe('Restrições de Perfis', () => {
        it('Não deve permitir que ADMIN avalie reembolsos', async () => {
            const createRes = await request(app)
                .post('/reembolsos')
                .set('Authorization', `Bearer ${tokenColaborador}`)
                .send({
                    nome: 'Taxi',
                    valor: 30.00,
                    categoriaId,
                    dataDespesa: new Date().toISOString()
                });

            await request(app)
                .post(`/reembolsos/${createRes.body.id}/enviar`)
                .set('Authorization', `Bearer ${tokenColaborador}`);

            const res = await request(app)
                .patch(`/reembolsos/${createRes.body.id}/avaliar`)
                .set('Authorization', `Bearer ${tokenAdmin}`)
                .send({ status: 'APROVADO' });

            expect(res.status).toBe(403);
        });

        it('Não deve permitir que ADMIN pague reembolsos', async () => {
            const createRes = await request(app)
                .post('/reembolsos')
                .set('Authorization', `Bearer ${tokenColaborador}`)
                .send({
                    nome: 'Estacionamento',
                    valor: 25.00,
                    categoriaId,
                    dataDespesa: new Date().toISOString()
                });

            await request(app)
                .post(`/reembolsos/${createRes.body.id}/enviar`)
                .set('Authorization', `Bearer ${tokenColaborador}`);

            await request(app)
                .patch(`/reembolsos/${createRes.body.id}/avaliar`)
                .set('Authorization', `Bearer ${tokenGestor}`)
                .send({ status: 'APROVADO' });

            const res = await request(app)
                .patch(`/reembolsos/${createRes.body.id}/pagar`)
                .set('Authorization', `Bearer ${tokenAdmin}`);

            expect(res.status).toBe(403);
        });

        it('Não deve permitir que FINANCEIRO avalie reembolsos', async () => {
            const createRes = await request(app)
                .post('/reembolsos')
                .set('Authorization', `Bearer ${tokenColaborador}`)
                .send({
                    nome: 'Material de escritório',
                    valor: 60.00,
                    categoriaId,
                    dataDespesa: new Date().toISOString()
                });

            await request(app)
                .post(`/reembolsos/${createRes.body.id}/enviar`)
                .set('Authorization', `Bearer ${tokenColaborador}`);

            const res = await request(app)
                .patch(`/reembolsos/${createRes.body.id}/avaliar`)
                .set('Authorization', `Bearer ${tokenFinanceiro}`)
                .send({ status: 'APROVADO' });

            expect(res.status).toBe(403);
        });
    });
});
