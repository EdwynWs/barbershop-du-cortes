import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import UsuarioRepository from '../repositories/usuarioRepository.js';
import UsuarioEntity from '../entities/usuarioEntity.js';
import { fail } from '../middlewares/error.js';
import {
    enviarVerificacaoEmail,
    confirmarEmailPorToken,
} from '../services/verificacaoEmail.js';
const repository = new UsuarioRepository();

export async function cadastro(req, res) {
    const { nome, email, senha } = req.body;

    const emailNormalizado =
        typeof email === 'string' ? email.trim().toLowerCase() : '';

    const telefone = String(req.body.telefone || '').replace(/\D/g, '');

    if (
        typeof nome !== 'string' ||
        !nome.trim() ||
        !/^\S+@\S+\.\S+$/.test(emailNormalizado) ||
        typeof senha !== 'string' ||
        senha.length < 8
    ) {
        fail('Informe nome, e-mail e senha com pelo menos 8 caracteres.');
    }

    if (!/^\d{10,11}$/.test(telefone)) {
        fail('Informe o telefone com DDD, sem o código +55.');
    }

    const senhaCriptografada = await bcrypt.hash(senha, 12);

    const usuario = await repository.cadastrarCliente(
        {
            nome: nome.trim(),
            email: emailNormalizado,
            telefone,
        },
        senhaCriptografada
    );

    let emailEnviado = false;

    try {
        emailEnviado = await enviarVerificacaoEmail(usuario.usu_email);
    } catch (error) {
        console.error(
            'Falha ao enviar a confirmação de cadastro:',
            error.code || error.message
        );
    }

    // A conta já foi criada, mesmo se o envio falhar.
    // Ela permanece pendente e o cliente pode solicitar outro link.
    res.status(201).json({
        emailEnviado,
        mensagem: emailEnviado
            ? 'Conta criada. Confira seu e-mail para confirmar o cadastro.'
            : 'Conta criada, mas o e-mail não foi enviado. Solicite outro link em um minuto.',
    });
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
    if (
    usuario.usu_tipo === 'CLIENTE' &&
    usuario.usu_email_confirmado !== true
    ) {
        fail(
            'Confirme seu e-mail antes de entrar. Use a opção de reenviar confirmação.',
            403
        );
    }
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

export async function confirmarEmail(req, res) {
    const confirmado = await confirmarEmailPorToken(req.body.token);

    if (!confirmado) {
        fail(
            'Este link é inválido, expirou ou já foi utilizado. Solicite outro ou tente entrar se já confirmou.',
            400
        );
    }

    res.json({
        mensagem: 'E-mail confirmado! Você já pode entrar no sistema.',
    });
}

export async function reenviarConfirmacao(req, res) {
    const email =
        typeof req.body.email === 'string'
            ? req.body.email.trim().toLowerCase()
            : '';

    if (!/^\S+@\S+\.\S+$/.test(email)) {
        fail('Informe um e-mail válido.');
    }

    try {
        await enviarVerificacaoEmail(email);
    } catch (error) {
        console.error(
            'Falha no reenvio da confirmação:',
            error.code || error.message
        );
    }

    // A resposta não revela quais endereços estão cadastrados.
    res.json({
        mensagem:
            'Se houver uma conta pendente e já tiver passado um minuto desde a última tentativa, enviaremos um novo link. Confira também o spam.',
    });
}