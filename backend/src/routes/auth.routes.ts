import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

const authRoutes = Router();
const authController = new AuthController();

// Esta é a rota que você vai chamar no Postman: POST /auth/login
authRoutes.post('/login', (req, res) => authController.login(req, res));

// Rota de cadastro: POST /auth/cadastro
authRoutes.post('/cadastro', (req, res) => authController.cadastro(req, res));


export { authRoutes };