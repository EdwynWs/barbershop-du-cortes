import { telefoneBrasil } from './telefone.js';

export function whatsappAtivo() {
    return process.env.WHATSAPP_ENABLED === 'true';
}

export async function enviarModelo(tipo, destino, dados) {
    const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
    const token = process.env.TWILIO_AUTH_TOKEN?.trim();
    const servico = process.env.TWILIO_MESSAGING_SERVICE_SID?.trim();
    const modelo = process.env[`TWILIO_TEMPLATE_${tipo}`]?.trim();
    const remetente = process.env.TWILIO_WHATSAPP_FROM?.trim();
    const numero = telefoneBrasil(destino);
    if (!sid || !/^AC[0-9a-f]{32}$/i.test(sid) || !token || !servico ||
        !/^MG[0-9a-f]{32}$/i.test(servico) || !/^HX[0-9a-f]{32}$/i.test(modelo || '') ||
        !/^\+[1-9]\d{7,14}$/.test(remetente || '') || !numero) {
        throw Object.assign(new Error('WHATSAPP_CONFIG_INVALIDA'), { definitivo: true });
    }
    const body = new URLSearchParams({
        From: `whatsapp:${remetente}`,
        To: `whatsapp:${numero}`,
        MessagingServiceSid: servico,
        ContentSid: modelo,
        ContentVariables: JSON.stringify({
            1: dados.cliente, 2: dados.servico, 3: dados.data,
            4: dados.horario, 5: dados.barbeiro,
        }),
    });
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: 'POST',
        headers: {
            Authorization: 'Basic ' + Buffer.from(`${sid}:${token}`).toString('base64'),
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
        signal: AbortSignal.timeout(15000),
    });
    const resultado = await response.json().catch(() => null);
    if (!response.ok) {
        throw Object.assign(new Error(`TWILIO_HTTP_${response.status}_${resultado?.code || 'SEM_CODIGO'}`), {
            retry: response.status === 429,
            definitivo: response.status >= 400 && response.status < 500,
        });
    }
    if (!resultado?.sid) throw new Error('TWILIO_RESPOSTA_INDEFINIDA');
    return resultado.sid;
}
