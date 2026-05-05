import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { loginSchema, cadastroSchema } from '../schemas/auth.schema';
import { z } from 'zod';

const authService = new AuthService();



export class AuthController {
    async login(req: Request, res: Response) {
        try {
            const data = loginSchema.parse(req.body);
            const result = await authService.login(data);

            if (!result) {
                return res.status(401).json({ error: 'E-mail ou senha inválidos' });
            }

            return res.json(result);
        } catch (error: any) {

            if (error instanceof z.ZodError) {
                return res.status(400).json({
                    mensagem: "Erro de validação",

                    detalhes: error.issues.map((e: z.ZodIssue) => ({
                        campo: e.path[0],
                        mensagem: e.message
                    }))
                });
            }

            if (error.message && (error.message.includes('inválido') || error.message.includes('senha'))) {
                return res.status(401).json({ error: error.message });
            }

            return res.status(500).json({
                error: 'Erro interno ao realizar login'
            });
        }
    }

    async cadastro(req: Request, res: Response) {
        try {
            const data = cadastroSchema.parse(req.body);
            const result = await authService.cadastro(data);
            return res.status(201).json(result);
        } catch (error: any) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({
                    mensagem: "Erro de validação",
                    detalhes: error.issues.map((e: z.ZodIssue) => ({
                        campo: e.path[0],
                        mensagem: e.message
                    }))
                });
            }

            if (error.message && error.message.includes('E-mail já cadastrado')) {
                return res.status(409).json({ error: error.message });
            }

            return res.status(500).json({
                error: 'Erro interno ao realizar cadastro'
            });
        }
    }
}