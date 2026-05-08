import { Router } from 'express';
import { CategoriaController } from '../controllers/categoria.controller';
import { authMiddleware } from '../middlewares/auth.middlewares';
import { authorize } from '../middlewares/role.middlewares';

const categoriaRoutes = Router();
const categoriaController = new CategoriaController();

categoriaRoutes.get('/', authMiddleware, (req, res) => categoriaController.findAll(req, res));

categoriaRoutes.get('/:id', authMiddleware, (req, res) => categoriaController.findById(req, res));

categoriaRoutes.post('/', authMiddleware, authorize(['ADMIN']), (req, res) => categoriaController.create(req, res));

categoriaRoutes.put('/:id', authMiddleware, authorize(['ADMIN']), (req, res) => categoriaController.update(req, res));

categoriaRoutes.patch('/:id/inativar', authMiddleware, authorize(['ADMIN']), (req, res) => categoriaController.inactivate(req, res));

export { categoriaRoutes };
