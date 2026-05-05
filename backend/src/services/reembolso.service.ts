import { PrismaClient } from '@prisma/client';
import { AppError } from '../errors/AppError'; // Certifique-se de que este arquivo existe

const prisma = new PrismaClient();

export class ReembolsoService {

    // 1. SOLICITAR (Agora inicia em DRAFT conforme Regra 10.1)
    async solicitar(userId: string, data: {
        nome: string;
        valor: number;
        categoriaId: string;
        descricao?: string;
        anexoUrl?: string;
        dataDespesa: string;
    }) {
        // Regra 10.1: Valor deve ser maior que zero
        if (data.valor <= 0) throw new AppError("O valor deve ser maior que zero", 400);

        // Regra 10.9: Categoria deve existir e estar ativa
        const categoria = await prisma.categoria.findUnique({ where: { id: data.categoriaId } });
        if (!categoria) throw new AppError("Categoria não encontrada", 404);

        // CORREÇÃO AQUI: De 'ativa' para 'ativo'
        if (!categoria.ativo) throw new AppError("Esta categoria está inativa", 400);

        return await prisma.$transaction(async (tx) => {
            const solicitacao = await tx.solicitacao.create({
                data: {
                    descricao: data.descricao || data.nome,
                    valor: data.valor,
                    categoriaId: data.categoriaId,
                    solicitanteId: userId,
                    status: 'DRAFT', // Regra 10.2: Inicia em Rascunho
                    dataDespesa: new Date(data.dataDespesa),
                    anexos: data.anexoUrl ? {
                        create: {
                            nomeArquivo: "comprovante",
                            urlArquivo: data.anexoUrl,
                            tipoArquivo: "image/png"
                        }
                    } : undefined
                },
                include: { categoria: true, anexos: true }
            });

            await tx.historico.create({
                data: {
                    acao: 'CREATED',
                    observacao: 'Solicitação criada em rascunho',
                    usuarioId: userId,
                    solicitacaoId: solicitacao.id
                }
            });

            return solicitacao;
        });
    }

    // 2. ENVIAR PARA ANÁLISE (Regra 10.3)
    async enviarParaAnalise(id: string, userId: string) {
        const solicitacao = await prisma.solicitacao.findUnique({ where: { id } });
        if (!solicitacao) throw new AppError("Solicitação não encontrada", 404);

        // Regra 10.3: Apenas o dono pode enviar
        if (solicitacao.solicitanteId !== userId) throw new AppError("Acesso negado", 403);

        // Regra 10.3: Apenas RASCUNHO pode ser enviado
        if (solicitacao.status !== 'DRAFT') {
            throw new AppError("Apenas solicitações em rascunho podem ser enviadas", 400);
        }

        return await prisma.$transaction(async (tx) => {
            const atualizada = await tx.solicitacao.update({
                where: { id },
                data: { status: 'SUBMITTED' }
            });

            await tx.historico.create({
                data: {
                    acao: 'SUBMITTED',
                    observacao: 'Solicitação enviada para análise',
                    usuarioId: userId,
                    solicitacaoId: id
                }
            });

            return atualizada;
        });
    }

    // 3. AVALIAR (Regras 10.4 e 10.5)
    async assess(id: string, userId: string, userPerfil: string, status: 'APROVADO' | 'REJEITADO', justificativa?: string) {
        if (userPerfil !== 'GESTOR') throw new AppError("Apenas gestores podem avaliar", 403);

        const solicitacao = await prisma.solicitacao.findUnique({ where: { id } });
        if (!solicitacao) throw new AppError("Solicitação não encontrada", 404);

        if (solicitacao.status !== 'SUBMITTED') {
            throw new AppError("Apenas solicitações enviadas podem ser avaliadas", 400);
        }

        if (status === 'REJEITADO' && !justificativa) {
            throw new AppError("Justificativa de rejeição é obrigatória", 400);
        }

        const novoStatus = status === 'APROVADO' ? 'APPROVED' : 'REJECTED';
        const acaoHistorico = status === 'APROVADO' ? 'APPROVED' : 'REJECTED';

        return await prisma.$transaction(async (tx) => {
            const atualizada = await tx.solicitacao.update({
                where: { id },
                data: { status: novoStatus }
            });

            await tx.historico.create({
                data: {
                    solicitacaoId: id,
                    usuarioId: userId,
                    acao: acaoHistorico,
                    observacao: justificativa || (status === 'APROVADO' ? "Solicitação aprovada pelo gestor" : "Solicitação rejeitada pelo gestor")
                }
            });

            return atualizada;
        });
    }

    // 4. PAGAR (Regra 10.6)
    async markAsPaid(solicitacaoId: string, userId: string, userPerfil: string) {
        // Regra 10.6: Apenas perfil FINANCEIRO pode pagar
        if (userPerfil !== 'FINANCEIRO') throw new AppError("Apenas o perfil financeiro pode realizar pagamentos", 403);

        const solicitacao = await prisma.solicitacao.findUnique({ where: { id: solicitacaoId } });
        if (!solicitacao) throw new AppError("Solicitação não encontrada", 404);

        // Regra 10.6: Apenas APPROVED podem ser pagas
        if (solicitacao.status !== 'APPROVED') {
            throw new AppError("Apenas solicitações aprovadas podem ser pagas", 400);
        }

        return await prisma.$transaction(async (tx) => {
            const atualizada = await tx.solicitacao.update({
                where: { id: solicitacaoId },
                data: { status: 'PAID' }
            });

            await tx.historico.create({
                data: {
                    acao: 'PAID',
                    observacao: 'Pagamento realizado pelo financeiro',
                    usuarioId: userId,
                    solicitacaoId: solicitacaoId
                }
            });

            return atualizada;
        });
    }

    // 5. CANCELAR (Regra implementada RASCUNHO -> CANCELADO, ENVIADO -> CANCELADO)
    async cancelar(id: string, userId: string) {
        const solicitacao = await prisma.solicitacao.findUnique({ where: { id } });
        if (!solicitacao) throw new AppError("Solicitação não encontrada", 404);

        if (solicitacao.solicitanteId !== userId) {
            throw new AppError("Apenas o solicitante pode cancelar este reembolso", 403);
        }

        if (solicitacao.status !== 'DRAFT' && solicitacao.status !== 'SUBMITTED') {
            throw new AppError("Apenas solicitações em rascunho ou enviadas para análise podem ser canceladas", 400);
        }

        return await prisma.$transaction(async (tx) => {
            const atualizada = await tx.solicitacao.update({
                where: { id },
                data: { status: 'CANCELED' }
            });

            await tx.historico.create({
                data: {
                    acao: 'CANCELED',
                    observacao: 'Solicitação cancelada pelo colaborador',
                    usuarioId: userId,
                    solicitacaoId: id
                }
            });

            return atualizada;
        });
    }

    // 6. EDITAR (Apenas RASCUNHO)
    async editar(id: string, userId: string, data: {
        nome?: string;
        valor?: number;
        categoriaId?: string;
        descricao?: string;
        anexoUrl?: string;
        dataDespesa?: string;
    }) {
        const solicitacao = await prisma.solicitacao.findUnique({ where: { id } });
        if (!solicitacao) throw new AppError("Solicitação não encontrada", 404);

        if (solicitacao.solicitanteId !== userId) {
            throw new AppError("Apenas o solicitante pode editar este reembolso", 403);
        }

        if (solicitacao.status !== 'DRAFT') {
            throw new AppError("Apenas reembolsos em rascunho podem ser editados", 400);
        }

        if (data.valor !== undefined && data.valor <= 0) {
            throw new AppError("O valor deve ser maior que zero", 400);
        }

        if (data.categoriaId) {
            const categoria = await prisma.categoria.findUnique({ where: { id: data.categoriaId } });
            if (!categoria) throw new AppError("Categoria não encontrada", 404);
            if (!categoria.ativo) throw new AppError("Esta categoria está inativa", 400);
        }

        const updateData: any = {};
        if (data.descricao || data.nome) updateData.descricao = data.descricao || data.nome;
        if (data.valor !== undefined) updateData.valor = data.valor;
        if (data.categoriaId) updateData.categoriaId = data.categoriaId;
        if (data.dataDespesa) updateData.dataDespesa = new Date(data.dataDespesa);

        return await prisma.$transaction(async (tx) => {
            const atualizada = await tx.solicitacao.update({
                where: { id },
                data: updateData
            });

            await tx.historico.create({
                data: {
                    acao: 'UPDATED',
                    observacao: 'Reembolso editado pelo colaborador',
                    usuarioId: userId,
                    solicitacaoId: id
                }
            });

            return atualizada;
        });
    }

    // 7. LISTAR
    async listByUser(userId: string, perfil: string) {
        const filter = perfil === 'COLABORADOR' ? { solicitanteId: userId } : {};

        return await prisma.solicitacao.findMany({
            where: filter,
            include: { categoria: true, anexos: true },
            orderBy: { criadoEm: 'desc' }
        });
    }

    // 6. HISTÓRICO (Regra 10.11)
    async getHistory(solicitacaoId: string) {
        const historico = await prisma.historico.findMany({
            where: { solicitacaoId },
            include: {
                usuario: { select: { nome: true, perfil: true } }
            },
            orderBy: { criadoEm: 'asc' }
        });

        if (historico.length === 0) throw new AppError("Histórico não encontrado", 404);
        return historico;
    }

    // 7. LISTAR ANEXOS
    async getAnexos(solicitacaoId: string) {
        const solicitacao = await prisma.solicitacao.findUnique({ where: { id: solicitacaoId } });
        if (!solicitacao) throw new AppError("Solicitação não encontrada", 404);

        return await prisma.anexo.findMany({
            where: { solicitacaoId },
            orderBy: { criadoEm: 'asc' }
        });
    }

    // 8. DETALHAR SOLICITAÇÃO
    async detalhar(id: string, userId: string, userPerfil: string) {
        const solicitacao = await prisma.solicitacao.findUnique({
            where: { id },
            include: {
                categoria: true,
                anexos: true,
                solicitante: { select: { id: true, nome: true, email: true, perfil: true } },
                historicos: {
                    include: { usuario: { select: { nome: true, perfil: true } } },
                    orderBy: { criadoEm: 'asc' }
                }
            }
        });

        if (!solicitacao) throw new AppError("Solicitação não encontrada", 404);

        // Apenas o solicitante, GESTOR, FINANCEIRO ou ADMIN podem ver
        const podeVisualizar = solicitacao.solicitanteId === userId ||
            ['GESTOR', 'FINANCEIRO', 'ADMIN'].includes(userPerfil);

        if (!podeVisualizar) throw new AppError("Acesso negado", 403);

        return solicitacao;
    }
}