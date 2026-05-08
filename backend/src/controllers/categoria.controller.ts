import { Request, Response } from 'express';
import { CategoriaService } from '../services/categoria.service';
import { criarCategoriaSchema, atualizarCategoriaSchema } from '../schemas/categoria.schema';
import { z } from 'zod';

const categoriaService = new CategoriaService();

export class CategoriaController {
    async create(req: Request, res: Response) {
        try {
            const data = criarCategoriaSchema.parse(req.body);
            const categoria = await categoriaService.create(data);
            return res.status(201).json(categoria);
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
            return res.status(400).json({ error: error.message });
        }
    }

    async findAll(req: Request, res: Response) {
        try {
            const categorias = await categoriaService.findAll();
            return res.json(categorias);
        } catch (error: any) {
            return res.status(500).json({ error: 'Erro interno ao listar categorias' });
        }
    }

    async findById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const categoria = await categoriaService.findById(id as string);
            return res.json(categoria);
        } catch (error: any) {
            if (error.message && error.message.includes('não encontrada')) {
                return res.status(404).json({ error: error.message });
            }
            return res.status(500).json({ error: 'Erro interno ao buscar categoria' });
        }
    }

    async update(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const data = atualizarCategoriaSchema.parse(req.body);
            const categoria = await categoriaService.update(id as string, data);
            return res.json(categoria);
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
            if (error.message && error.message.includes('não encontrada')) {
                return res.status(404).json({ error: error.message });
            }
            return res.status(400).json({ error: error.message });
        }
    }

    async inactivate(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const categoria = await categoriaService.inactivate(id as string);
            return res.json(categoria);
        } catch (error: any) {
            if (error.message && error.message.includes('não encontrada')) {
                return res.status(404).json({ error: error.message });
            }
            return res.status(400).json({ error: error.message });
        }
    }
}
