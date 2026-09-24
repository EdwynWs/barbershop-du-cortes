import { query } from '../config/db.js';
export async function sendDueReminders() {
    await query(`INSERT INTO tb_notificacao(usu_id,not_titulo,not_mensagem)
 SELECT u.usu_id,'Lembrete de horário','Seu atendimento começa em cerca de 30 minutos. Agendamento #'||a.age_id
 FROM tb_agendamento a JOIN tb_cliente c ON c.cli_id=a.cli_id JOIN tb_usuario u ON u.usu_id=c.usu_id
 WHERE a.age_status IN ('AGENDADO','CONFIRMADO')
 AND (a.age_data+a.age_hora_inicio) BETWEEN (now() AT TIME ZONE 'America/Sao_Paulo')+interval '29 minutes' AND (now() AT TIME ZONE 'America/Sao_Paulo')+interval '31 minutes'
 AND NOT EXISTS(SELECT 1 FROM tb_notificacao n WHERE n.usu_id=u.usu_id AND n.not_titulo='Lembrete de horário' AND n.not_mensagem LIKE '%#'||a.age_id)`);
}
export function startReminders() {
    const run = () => sendDueReminders().catch((e) => console.error('Falha ao gerar lembretes', e));
    run();
    setInterval(run, 60_000).unref();
}
