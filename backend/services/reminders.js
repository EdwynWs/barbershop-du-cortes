import { query } from '../config/db.js';
import { enfileirarLembretes, processarFila } from './whatsappFila.js';

export async function sendDueReminders() {
    await query(`
        INSERT INTO tb_notificacao(usu_id,not_titulo,not_mensagem,not_chave)
        SELECT u.usu_id, 'Lembrete de horário',
            'Seu atendimento está próximo: '||to_char(a.age_hora_inicio,'HH24:MI')||'. Agendamento #'||a.age_id,
            'lembrete:'||a.age_id||':'||a.age_aviso_versao
        FROM tb_agendamento a JOIN tb_cliente c ON c.cli_id=a.cli_id
        JOIN tb_usuario u ON u.usu_id=c.usu_id
        WHERE NOT u.usu_contato AND a.age_status IN ('AGENDADO','CONFIRMADO')
            AND (a.age_data+a.age_hora_inicio) AT TIME ZONE 'America/Sao_Paulo' > now()
            AND (a.age_data+a.age_hora_inicio) AT TIME ZONE 'America/Sao_Paulo' <= now()+interval '20 minutes'
        ON CONFLICT(not_chave) DO NOTHING
    `);
    await enfileirarLembretes();
    await processarFila();
}

export function startReminders() {
    if (process.env.REMINDERS_IN_PROCESS === 'false') return;
    let running = false;
    const run = async () => {
        if (running) return;
        running = true;
        try { await sendDueReminders(); }
        catch (error) { console.error('Falha ao gerar avisos:', error.code || error.message); }
        finally { running = false; }
    };
    void run();
    setInterval(run, 60_000).unref();
}
