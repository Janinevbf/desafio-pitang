import { Request, Response } from 'express';
import { UsuarioService } from '../services/usuario.service';
import { criarUsuarioSchema, editarUsuarioSchema } from '../schemas/usuario.schema';
import { z } from 'zod';

const usuarioService = new UsuarioService();

export class UsuarioController {
    async listar(req: Request, res: Response) {
        try {
            const usuarios = await usuarioService.listarTodos();
            return res.json(usuarios);
        } catch (error: any) {
            return res.status(500).json({ error: error.message });
        }
    }

    async buscarPorId(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const usuario = await usuarioService.buscarPorId(id);
            return res.json(usuario);
        } catch (error: any) {
            return res.status(error.statusCode || 400).json({ error: error.message });
        }
    }

    async criar(req: Request, res: Response) {
        try {
            const dados = criarUsuarioSchema.parse(req.body);
            const usuario = await usuarioService.criar(dados);
            return res.status(201).json(usuario);
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
            return res.status(error.statusCode || 400).json({ error: error.message });
        }
    }

    async editar(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const dados = editarUsuarioSchema.parse(req.body);
            const usuario = await usuarioService.editar(id, dados);
            return res.json(usuario);
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
            return res.status(error.statusCode || 400).json({ error: error.message });
        }
    }

    async deletar(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await usuarioService.deletar(id);
            return res.json({ mensagem: "Usuário removido com sucesso" });
        } catch (error: any) {
            return res.status(error.statusCode || 400).json({ error: error.message });
        }
    }
}
