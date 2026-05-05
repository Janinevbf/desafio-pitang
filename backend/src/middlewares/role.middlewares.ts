import { Request, Response, NextFunction } from 'express';

export const authorize = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = req.user;

        if (!user || !roles.includes(user.perfil)) {
            return res.status(403).json({
                error: "Acesso negado. Você não tem permissão para esta ação."
            });
        }

        next();
    };
};