import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';

const authRoutes = Router();
const authController = new AuthController();

authRoutes.post('/login', (req, res) => authController.login(req, res));

authRoutes.post('/cadastro', (req, res) => authController.cadastro(req, res));


export { authRoutes };