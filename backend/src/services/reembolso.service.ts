import { PrismaClient } from '@prisma/client';
import { AppError } from '../errors/AppError';
const prisma = new PrismaClient();

export class ReembolsoService {


    async solicitar(userId: string, data: {
        nome: string;
        valor: number;
        categoriaId: string;
        descricao?: string;
        anexoUrl?: string;
        dataDespesa: string;
    }) {
        if (data.valor <= 0) throw new AppError("O valor deve ser maior que zero", 400);


        const categoria = await prisma.categoria.findUnique({ where: { id: data.categoriaId } });
        if (!categoria) throw new AppError("Categoria não encontrada", 404);


        if (!categoria.ativo) throw new AppError("Esta categoria está inativa", 400);

        return await prisma.$transaction(async (tx) => {
            const solicitacao = await tx.solicitacao.create({
                data: {
                    descricao: data.descricao || data.nome,
                    valor: data.valor,
                    categoriaId: data.categoriaId,
                    solicitanteId: userId,
                    status: 'DRAFT',
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


    async enviarParaAnalise(id: string, userId: string) {
        const solicitacao = await prisma.solicitacao.findUnique({ where: { id } });
        if (!solicitacao) throw new AppError("Solicitação não encontrada", 404);

        if (solicitacao.solicitanteId !== userId) throw new AppError("Acesso negado", 403);

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


    async markAsPaid(solicitacaoId: string, userId: string, userPerfil: string) {

        if (userPerfil !== 'FINANCEIRO') throw new AppError("Apenas o perfil financeiro pode realizar pagamentos", 403);

        const solicitacao = await prisma.solicitacao.findUnique({ where: { id: solicitacaoId } });
        if (!solicitacao) throw new AppError("Solicitação não encontrada", 404);


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


    async editar(id: string, userId: string, userPerfil: string, data: {
        nome?: string;
        valor?: number;
        categoriaId?: string;
        descricao?: string;
        anexoUrl?: string;
        dataDespesa?: string;
    }) {
        const solicitacao = await prisma.solicitacao.findUnique({
            where: { id },
            include: { anexos: true }
        });

        if (!solicitacao) throw new AppError("Solicitação não encontrada", 404);

        const ehDono = solicitacao.solicitanteId === userId;
        const ehAdmin = userPerfil === 'ADMIN';

        if (!ehDono && !ehAdmin) {
            throw new AppError("Acesso negado", 403);
        }

        if (solicitacao.status !== 'DRAFT') {
            throw new AppError("Apenas reembolsos em rascunho podem ser editados", 400);
        }


        if (data.valor !== undefined && data.valor <= 0) throw new AppError("Valor inválido", 400);

        const updateData: any = {};
        if (data.nome || data.descricao) updateData.descricao = data.descricao || data.nome;
        if (data.valor !== undefined) updateData.valor = data.valor;
        if (data.categoriaId) updateData.categoriaId = data.categoriaId;
        if (data.dataDespesa) updateData.dataDespesa = new Date(data.dataDespesa);

        return await prisma.$transaction(async (tx) => {

            if (data.anexoUrl) {
                await tx.anexo.create({
                    data: {
                        nomeArquivo: "comprovante_editado",
                        urlArquivo: data.anexoUrl,
                        tipoArquivo: data.anexoUrl.startsWith("data:image") ? "image/png" : "application/pdf",
                        solicitacaoId: id
                    }
                });
            }

            const atualizada = await tx.solicitacao.update({
                where: { id },
                data: updateData
            });

            await tx.historico.create({
                data: {
                    acao: 'UPDATED',
                    observacao: `Reembolso editado. ${data.anexoUrl ? 'Novo anexo adicionado.' : ''}`,
                    usuarioId: userId,
                    solicitacaoId: id
                }
            });

            return atualizada;
        });
    }

    async listByUser(userId: string, perfil: string) {
        const filter = perfil === 'COLABORADOR' ? { solicitanteId: userId } : {};

        return await prisma.solicitacao.findMany({
            where: filter,
            include: { categoria: true, anexos: true },
            orderBy: { criadoEm: 'desc' }
        });
    }

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


    async getAnexos(solicitacaoId: string) {
        const solicitacao = await prisma.solicitacao.findUnique({ where: { id: solicitacaoId } });
        if (!solicitacao) throw new AppError("Solicitação não encontrada", 404);

        return await prisma.anexo.findMany({
            where: { solicitacaoId },
            orderBy: { criadoEm: 'asc' }
        });
    }


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

        const podeVisualizar = solicitacao.solicitanteId === userId ||
            ['GESTOR', 'FINANCEIRO', 'ADMIN'].includes(userPerfil);

        if (!podeVisualizar) throw new AppError("Acesso negado", 403);

        return solicitacao;
    }
}