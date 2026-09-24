import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import UsuarioRepository from '../repositories/usuarioRepository.js';
import UsuarioEntity from '../entities/usuarioEntity.js';
import { fail } from '../middlewares/error.js';
const repository = new UsuarioRepository();

export async function cadastro(req, res) {
    const { nome, email, senha } = req.body;
    const telefone = String(req.body.telefone || '').replace(/\D/g, '');

    if (!/^\d{10,11}$/.test(telefone)) {
        fail('Informe um telefone brasileiro com DDD, sem o código +55.');
    }
    if (
        typeof nome !== 'string' ||
        !nome.trim() ||
        !/^\S+@\S+\.\S+$/.test(email || '') ||
        typeof senha !== 'string' ||
        senha.length < 8
    ) {
        fail('Informe nome, email e senha com pelo menos 8 caracteres.');
    }
    const senhaCriptografada = await bcrypt.hash(senha, 12);
    const usuario = await repository.cadastrarCliente(
    {
        ...req.body,
        telefone,
    },
    senhaCriptografada
    );
    res.status(201).json(UsuarioEntity.toMap(usuario));
}

export async function login(req, res) {
    const email = String(req.body.email || '')
        .toLowerCase()
        .trim();
    const usuario = await repository.buscarPorEmail(email);
    const senhaValida =
        usuario &&
        typeof req.body.senha === 'string' &&
        (await bcrypt.compare(req.body.senha, usuario.usu_senha));
    if (!senhaValida) fail('Credenciais inválidas.', 401);
    const token = jwt.sign({ id: usuario.usu_id, tipo: usuario.usu_tipo }, process.env.JWT_SECRET, {
        expiresIn: '12h',
    });
    res.cookie('session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 12 * 3600 * 1000,
    });
    res.json(UsuarioEntity.toMap(usuario));
}

export async function me(req, res) {
    const usuario = await repository.buscarPorId(req.user.id);
    if (!usuario) fail('Usuário indisponível.', 401);
    res.json(UsuarioEntity.toMap(usuario));
}

export function logout(req, res) {
    res.clearCookie('session', { sameSite: 'lax', secure: process.env.NODE_ENV === 'production' });
    res.json({ ok: true });
}
