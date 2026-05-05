import request from 'supertest';
import { app } from '../app'; // Certifique-se de que seu app Express está exportado aqui

describe('Auth Flow', () => {
    it('Deve retornar 200 e um token ao fazer login com credenciais válidas', async () => {
        const response = await request(app)
            .post('/auth/login')
            .send({
                email: 'gestor@test.com', // Use um usuário que você sabe que existe no seu SQLite de teste
                senha: 'pitang123'
            });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('token');
    });

    it('Deve retornar 401 ao tentar login com senha errada', async () => {
        const response = await request(app)
            .post('/auth/login')
            .send({
                email: 'gestor@test.com',
                senha: 'senha_errada'
            });

        expect(response.status).toBe(401);
    });
});