import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { LoginInput, CadastroInput } from '../schemas/auth.schema';

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'chave-secreta-desafio-pitang';

export class AuthService {
    async login({ email, senha }: LoginInput) {

        const user = await prisma.user.findUnique({
            where: { email },
        });


        if (!user) {
            throw new Error('E-mail ou senha inválidos');
        }


        const isPasswordValid = await bcrypt.compare(senha, user.senha);

        if (!isPasswordValid) {
            throw new Error('E-mail ou senha inválidos');
        }


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