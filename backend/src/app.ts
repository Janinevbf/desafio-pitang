import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { authRoutes } from './routes/auth.routes';
import { reembolsoRoutes } from './routes/reembolso.routes';
import { categoriaRoutes } from './routes/categoria.routes';
import { adminRoutes } from './routes/admin.routes';
import { AppError } from './errors/AppError';

const app = express();

app.use(cors());
app.use(express.json());

// Rotas
app.use('/auth', authRoutes);
app.use('/reembolsos', reembolsoRoutes);
app.use('/categorias', categoriaRoutes);
app.use('/admin', adminRoutes);

// Middleware de erro global (deve vir DEPOIS das rotas)
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            status: 'error',
            message: err.message
        });
    }

    // Log para depuração interna
    console.error(' [SERVER ERROR]:', err);

    return res.status(500).json({
        status: 'error',
        message: 'Internal server error'
    });
});

export { app };