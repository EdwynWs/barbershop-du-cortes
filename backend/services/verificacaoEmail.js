import { randomBytes, createHash } from 'node:crypto';
import { enviarMensagem } from './email.js';
import {
    reservarToken,
    confirmarToken,
} from '../repositories/verificacaoEmailRepository.js';

function calcularHash(token) {
    return createHash('sha256').update(token).digest('hex');
}

export async function enviarVerificacaoEmail(email) {
    if (!process.env.FRONTEND_URL) {
        throw new Error('Configure FRONTEND_URL no backend/.env.');
    }

    const token = randomBytes(32).toString('hex');

    const link = new URL('/confirmar-email', process.env.FRONTEND_URL);

    // O token fica no fragmento do link, fora da URL enviada ao servidor web.
    link.hash = `token=${token}`;

    const usuario = await reservarToken(email, calcularHash(token));

    // Não existe conta pendente ou ainda está no intervalo de reenvio.
    if (!usuario) {
        return false;
    }

    const mensagem = [
        `Olá, ${usuario.usu_nome}!`,
        '',
        'Confirme seu e-mail para acessar a Barbershop Du Cortes.',
        '',
        'Abra o link abaixo e clique em "Confirmar meu e-mail":',
        link.toString(),
        '',
        'Este link é válido por 30 minutos e só pode ser usado uma vez.',
        'Ao solicitar outro link, o anterior deixa de funcionar.',
        '',
        'Se você não criou esta conta, ignore esta mensagem.',
        '',
        'Barbershop Du Cortes',
    ].join('\n');

    await enviarMensagem(
        usuario.usu_email,
        'Confirme seu e-mail — Du Cortes',
        mensagem
    );

    return true;
}

export async function confirmarEmailPorToken(token) {
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) {
        return false;
    }

    return confirmarToken(calcularHash(token));
}