import 'dotenv/config';
import { verificarEmail } from './services/email.js';

try {
    await verificarEmail();

    console.log('SUCESSO: conexão e autenticação do e-mail funcionando.');
} catch (error) {
    console.error('Não foi possível autenticar o envio:', {
        codigo: error.code,
        mensagem: error.message,
        respostaSMTP: error.response,
    });

    process.exitCode = 1;
}