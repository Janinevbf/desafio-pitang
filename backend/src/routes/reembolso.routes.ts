import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middlewares';
import { PrismaClient } from '@prisma/client';
import { ReembolsoService } from '../services/reembolso.service';
import { criarReembolsoSchema, avaliarReembolsoSchema, editarReembolsoSchema } from '../schemas/reembolso.schema';
import { authorize } from '../middlewares/role.middlewares';
import { z } from 'zod';
import dayjs from 'dayjs';
import 'dayjs/locale/pt-br';

dayjs.locale('pt-br');


const reembolsoRoutes = Router();
const service = new ReembolsoService();
const prisma = new PrismaClient();

// Rota para ver as categorias (Auxiliar)
reembolsoRoutes.get('/categorias', authMiddleware, async (req, res) => {
    const categorias = await prisma.categoria.findMany();
    return res.json(categorias);
});

// Criar Reembolso (Com Validação Zod e Histórico)
reembolsoRoutes.post('/', authMiddleware, async (req, res) => {
    try {
        // Validação obrigatória com Zod
        const dadosValidados = criarReembolsoSchema.parse(req.body);

        const result = await service.solicitar(req.user!.id, dadosValidados);
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
        return res.status(400).json({ error: error.message });
    }
});

// Editar Reembolso (Apenas Rascunho)
reembolsoRoutes.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const dadosValidados = editarReembolsoSchema.parse(req.body);
        const resultado = await service.editar(id as string, req.user!.id, dadosValidados);
        return res.json({ message: "Reembolso atualizado com sucesso!", resultado });
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
});

// Listagem do próprio colaborador
reembolsoRoutes.get('/meus-reembolsos', authMiddleware, async (req, res) => {
    try {
        const solicitacoes = await service.listByUser(req.user!.id, req.user!.perfil);
        return res.json(solicitacoes);
    } catch (error: any) {
        return res.status(400).json({ error: error.message });
    }
});

// Listagem de pendentes (Apenas Gestor)
reembolsoRoutes.get('/pendentes', authMiddleware, authorize(['GESTOR']), async (req, res) => {
    const pendentes = await prisma.solicitacao.findMany({
        where: { status: 'SUBMITTED' },
        include: { solicitante: { select: { nome: true, email: true } } }
    });
    return res.json(pendentes);
});

// Listagem de aprovadas (Apenas Financeiro)
reembolsoRoutes.get('/aprovados', authMiddleware, authorize(['FINANCEIRO']), async (req, res) => {
    const aprovados = await prisma.solicitacao.findMany({
        where: { status: 'APPROVED' },
        include: { solicitante: { select: { nome: true, email: true } }, anexos: true, categoria: true },
        orderBy: { criadoEm: 'desc' }
    });
    return res.json(aprovados);
});

// Rejeitar Solicitação (Apenas Gestor) - POST específico
reembolsoRoutes.post('/:id/rejeitar', authMiddleware, authorize(['GESTOR']), async (req, res) => {
    try {
        const { id } = req.params;
        const { justificativa } = req.body;

        if (!justificativa) {
            return res.status(400).json({ error: "Justificativa de rejeição é obrigatória" });
        }

        const resultado = await service.assess(id as string, req.user!.id, req.user!.perfil, 'REJEITADO', justificativa);
        return res.json({ message: "Solicitação rejeitada com sucesso!", resultado });
    } catch (error: any) {
        return res.status(error.statusCode || 400).json({ error: error.message });
    }
});

// Enviar para análise
reembolsoRoutes.post('/:id/enviar', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await service.enviarParaAnalise(id as string, req.user!.id);
        return res.json(result);
    } catch (error: any) {
        // Trata AppError e outros erros
        return res.status(error.statusCode || 400).json({ error: error.message });
    }
});

// Rejeitar Solicitação (Apenas Gestor) - POST específico
reembolsoRoutes.post('/:id/rejeitar', authMiddleware, authorize(['GESTOR']), async (req, res) => {
    try {
        const { id } = req.params;
        const { justificativa } = req.body;

        if (!justificativa) {
            return res.status(400).json({ error: "Justificativa de rejeição é obrigatória" });
        }

        const resultado = await service.assess(id as string, req.user!.id, req.user!.perfil, 'REJEITADO', justificativa);
        return res.json({ message: "Solicitação rejeitada com sucesso!", resultado });
    } catch (error: any) {
        return res.status(error.statusCode || 400).json({ error: error.message });
    }
});

// Aprovar ou Rejeitar (Apenas Gestor)
reembolsoRoutes.patch('/:id/avaliar', authMiddleware, authorize(['GESTOR']), async (req, res) => {
    try {
        const { id } = req.params;
        const { status, justificativa } = avaliarReembolsoSchema.parse(req.body);

        // Importante: Passamos o ID do usuário logado para o Histórico
        const resultado = await service.assess(id as string, req.user!.id, req.user!.perfil, status, justificativa);
        return res.json({ message: `Solicitação ${status} com sucesso!`, resultado });
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
});

// Marcar como PAGO (Apenas Financeiro)
reembolsoRoutes.patch('/:id/pagar', authMiddleware, authorize(['FINANCEIRO']), async (req, res) => {
    try {
        const { id } = req.params;
        const resultado = await service.markAsPaid(id as string, req.user!.id, req.user!.perfil);
        return res.json({ message: "Pagamento confirmado com sucesso!", resultado });
    } catch (error: any) {
        return res.status(400).json({ error: error.message });
    }
});

// Cancelar Reembolso (Rascunho ou Enviado)
reembolsoRoutes.patch('/:id/cancelar', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const resultado = await service.cancelar(id as string, req.user!.id);
        return res.json({ message: "Reembolso cancelado com sucesso!", resultado });
    } catch (error: any) {
        return res.status(error.statusCode || 400).json({ error: error.message });
    }
});

// Detalhar Solicitação Específica
reembolsoRoutes.get('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const resultado = await service.detalhar(id as string, req.user!.id, req.user!.perfil);
        return res.json(resultado);
    } catch (error: any) {
        return res.status(error.statusCode || 400).json({ error: error.message });
    }
});

// Histórico da Solicitação (Manipulação de data com DayJs)
reembolsoRoutes.get('/:id/historico', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const historico = await service.getHistory(id as string);

        const historicoFormatado = historico.map(item => ({
            ...item,
            dataFormatada: dayjs(item.criadoEm).format('DD/MM/YYYY HH:mm')
        }));

        return res.json(historicoFormatado);
    } catch (error: any) {
        return res.status(400).json({ error: error.message });
    }
});

// Listar Anexos da Solicitação
reembolsoRoutes.get('/:id/anexos', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const anexos = await service.getAnexos(id as string);
        return res.json(anexos);
    } catch (error: any) {
        return res.status(400).json({ error: error.message });
    }
});

// Detalhar Solicitação Específica (deve ser a última rota com :id)
reembolsoRoutes.get('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const resultado = await service.detalhar(id as string, req.user!.id, req.user!.perfil);
        return res.json(resultado);
    } catch (error: any) {
        return res.status(error.statusCode || 400).json({ error: error.message });
    }
});

export { reembolsoRoutes };