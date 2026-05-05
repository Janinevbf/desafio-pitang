import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'chave-secreta-desafio-pitang';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    // 1. Pega o token do cabeçalho 'Authorization'
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'Token não fornecido' });
    }

    // O formato padrão é "Bearer TOKEN_AQUI"
    const [, token] = authHeader.split(' ');

    try {
        // 2. Valida o token
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string; perfil: string };

        // 3. Injeta os dados do usuário na requisição para uso posterior
        req.user = decoded;

        return next();
    } catch (err) {
        return res.status(401).json({ error: 'Token inválido ou expirado' });
    }
};