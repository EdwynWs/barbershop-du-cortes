import { randomBytes, createHash } from 'node:crypto';
import bcrypt from 'bcrypt';
import { enviarMensagem } from './email.js';
import * as repository from '../repositories/recuperacaoSenhaRepository.js';
import { fail } from '../middlewares/error.js';

function calcularHash(token) {
    return createHash('sha256').update(token).digest('hex');
}

export async function solicitarRecuperacao(email) {
    const token = randomBytes(32).toString('hex');
    const link = new URL('/redefinir-senha', process.env.FRONTEND_URL);
    if (!['http:', 'https:'].includes(link.protocol) ||
        (process.env.NODE_ENV === 'production' && link.protocol !== 'https:')) {
        throw new Error('Configure FRONTEND_URL com uma URL HTTPS válida em produção.');
    }
    link.hash = `token=${token}`;
    const usuario = await repository.reservarToken(email, calcularHash(token));
    if (!usuario) return;

    // O envio não altera a resposta pública nem revela se a conta existe.
    // A senha atual permanece válida até a confirmação da nova senha.
    void enviarMensagem(
        usuario.usu_email,
        'Redefina sua senha — Du Cortes',
        [
            'Recebemos uma solicitação para redefinir sua senha na Barbershop Du Cortes.',
            '',
            'Abra o link abaixo para escolher uma nova senha:',
            link.toString(),
            '',
            'O link vale por 30 minutos e só pode ser utilizado uma vez.',
            'Ao solicitar outro link, o anterior deixa de funcionar.',
            'Se você não solicitou a alteração, ignore este e-mail. Sua senha não foi alterada.',
        ].join('\n')
    ).catch(() => {
        // Não registrar token, endereço de e-mail ou conteúdo do provedor.
        console.error('Falha ao enviar o e-mail de recuperação de senha.');
    });
}

export async function confirmarNovaSenha(token, senha) {
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) {
        fail('Link inválido, expirado ou já utilizado. Solicite um novo link.');
    }
    // bcrypt considera apenas os primeiros 72 bytes da senha.
    if (typeof senha !== 'string' || senha.length < 8 || Buffer.byteLength(senha, 'utf8') > 72) {
        fail('Use uma senha com pelo menos 8 caracteres e no máximo 72 bytes.');
    }
    const senhaCriptografada = await bcrypt.hash(senha, 12);
    const alterada = await repository.redefinirSenha(calcularHash(token), senhaCriptografada);
    if (!alterada) fail('Link inválido, expirado ou já utilizado. Solicite um novo link.');
}
