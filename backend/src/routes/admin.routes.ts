import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middlewares';
import { authorize } from '../middlewares/role.middlewares';
import { UsuarioController } from '../controllers/usuario.controller';
import { PrismaClient } from '@prisma/client';

const adminRoutes = Router();
const usuarioController = new UsuarioController();
const prisma = new PrismaClient();

adminRoutes.use(authMiddleware, authorize(['ADMIN']));

adminRoutes.get('/usuarios', (req, res) => usuarioController.listar(req, res));
adminRoutes.get('/usuarios/:id', (req, res) => usuarioController.buscarPorId(req, res));
adminRoutes.post('/usuarios', (req, res) => usuarioController.criar(req, res));
adminRoutes.put('/usuarios/:id', (req, res) => usuarioController.editar(req, res));
adminRoutes.delete('/usuarios/:id', (req, res) => usuarioController.deletar(req, res));

adminRoutes.get('/dashboard', async (req, res) => {
    try {
        const totalSolicitacoes = await prisma.solicitacao.count();
        const totalUsuarios = await prisma.user.count();
        const totalCategorias = await prisma.categoria.count({ where: { ativo: true } });

        const statusCount = await prisma.solicitacao.groupBy({
            by: ['status'],
            _count: true
        });

        const valorTotal = await prisma.solicitacao.aggregate({
            _sum: { valor: true }
        });

        return res.json({
            estatisticas: {
                totalSolicitacoes,
                totalUsuarios,
                totalCategoriasAtivas: totalCategorias,
                valorTotalReembolsos: valorTotal._sum.valor
            },
            statusSolicitacoes: statusCount
        });
    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
});

export { adminRoutes };
