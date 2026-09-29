import { fail } from '../middlewares/error.js';
import { solicitarRecuperacao, confirmarNovaSenha } from '../services/recuperacaoSenha.js';

export async function esqueciSenha(req, res) {
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (email.length > 255 || !/^\S+@\S+\.\S+$/.test(email)) {
        fail('Informe um e-mail válido.');
    }
    await solicitarRecuperacao(email);
    res.set('Cache-Control', 'no-store').json({
        mensagem: 'Se houver uma conta ativa com esse e-mail, enviaremos um link para redefinir a senha. Confira também o spam. Aguarde um minuto antes de pedir outro link.',
    });
}

export async function redefinirSenha(req, res) {
    await confirmarNovaSenha(req.body.token, req.body.senha);
    res.clearCookie('session', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
    });
    res.set('Cache-Control', 'no-store').json({
        mensagem: 'Senha alterada! Entre novamente com sua nova senha.',
    });
}
