import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { LoginInput, CadastroInput } from '../schemas/auth.schema';

const prisma = new PrismaClient();
// Em produção, essa chave deve estar no seu arquivo .env
const JWT_SECRET = process.env.JWT_SECRET || 'chave-secreta-desafio-pitang';

export class AuthService {
    async login({ email, senha }: LoginInput) {
        // 1. Busca o usuário no banco pelo email
        const user = await prisma.user.findUnique({
            where: { email },
        });

        // 2. Se não achar, lança erro genérico por segurança
        if (!user) {
            throw new Error('E-mail ou senha inválidos');
        }

        // 3. Verifica se a senha enviada bate com o hash do banco[cite: 1]
        const isPasswordValid = await bcrypt.compare(senha, user.senha);

        if (!isPasswordValid) {
            throw new Error('E-mail ou senha inválidos');
        }

        // 4. Gera o Token JWT com ID e Perfil (Role)[cite: 1]
        const token = jwt.sign(
            { id: user.id, perfil: user.perfil },
            JWT_SECRET,
            { expiresIn: '1d' } // Token vale por 24 horas[cite: 1]
        );

        // 5. Retorna dados do usuário e o token (nunca retorne a senha!)[cite: 1]
        return {
            user: {
                id: user.id,
                nome: user.nome,
                email: user.email,
                perfil: user.perfil,
            },
            token,
        };
    }

    async cadastro({ nome, email, senha, perfil }: CadastroInput) {
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            throw new Error('E-mail já cadastrado');
        }

        const saltRounds = 12;
        const senhaHash = await bcrypt.hash(senha, saltRounds);

        const user = await prisma.user.create({
            data: {
                nome,
                email,
                senha: senhaHash,
                perfil: perfil || 'COLABORADOR',
            },
        });

        const token = jwt.sign(
            { id: user.id, perfil: user.perfil },
            JWT_SECRET,
            { expiresIn: '1d' }
        );

        return {
            user: {
                id: user.id,
                nome: user.nome,
                email: user.email,
                perfil: user.perfil,
            },
            token,
        };
    }
}