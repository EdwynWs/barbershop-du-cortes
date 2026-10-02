import { query } from '../config/db.js';
import { telefoneBrasil } from './telefone.js';
import { enviarModelo, whatsappAtivo } from './whatsapp.js';

export async function enfileirarConfirmacoes(conexao, id) {
    if (!whatsappAtivo()) return;
    await conexao.query(`
        INSERT INTO tb_whatsapp_fila(age_id, versao, tipo, destino)
        SELECT age_id, age_aviso_versao, 'CLIENTE', age_whatsapp_telefone
        FROM tb_agendamento WHERE age_id=$1 AND age_whatsapp
        ON CONFLICT DO NOTHING
    `, [id]);
    const dono = telefoneBrasil(process.env.BARBEIRO_WHATSAPP);
    if (dono && process.env.WHATSAPP_OWNER_OPT_IN === 'true') {
        await conexao.query(`
            INSERT INTO tb_whatsapp_fila(age_id, versao, tipo, destino)
            SELECT age_id, age_aviso_versao, 'DONO', $2 FROM tb_agendamento WHERE age_id=$1
            ON CONFLICT DO NOTHING
        `, [id, dono]);
    }
}

export async function enfileirarLembretes() {
    if (!whatsappAtivo()) return;
    await query(`
        INSERT INTO tb_whatsapp_fila(age_id, versao, tipo, destino)
        SELECT age_id, age_aviso_versao, 'LEMBRETE', age_whatsapp_telefone
        FROM tb_agendamento
        WHERE age_whatsapp AND age_status IN ('AGENDADO','CONFIRMADO')
            AND (age_data+age_hora_inicio) AT TIME ZONE 'America/Sao_Paulo' > now()
            AND (age_data+age_hora_inicio) AT TIME ZONE 'America/Sao_Paulo' <= now()+interval '20 minutes'
        ON CONFLICT DO NOTHING
    `);
}

export async function processarFila() {
    if (!whatsappAtivo()) return;
    // Uma interrupção pode ter ocorrido depois de o provedor aceitar a mensagem.
    // Não reenviar automaticamente um envio de resultado desconhecido.
    await query(`UPDATE tb_whatsapp_fila SET status='INCERTO', erro='PROCESSO_INTERROMPIDO'
        WHERE status='PROCESSANDO' AND atualizado_em < now()-interval '5 minutes'`);
    for (let n = 0; n < 20; n++) {
        const { rows: [aviso] } = await query(`
            UPDATE tb_whatsapp_fila f SET status='PROCESSANDO',
                tentativas=tentativas+1, atualizado_em=now()
            WHERE id=(SELECT id FROM tb_whatsapp_fila
                WHERE status='PENDENTE' AND tentar_em<=now()
                ORDER BY tentar_em,id FOR UPDATE SKIP LOCKED LIMIT 1)
            RETURNING f.*
        `);
        if (!aviso) break;
        try {
            const { rows: [dados] } = await query(`
                SELECT a.*, u.usu_nome AS cliente, s.ser_nome AS servico,
                    ub.usu_nome AS barbeiro, to_char(age_data,'DD/MM/YYYY') AS data,
                    to_char(age_hora_inicio,'HH24:MI') AS horario,
                    ((age_data+age_hora_inicio) AT TIME ZONE 'America/Sao_Paulo' > now()) AS futuro
                FROM tb_agendamento a JOIN tb_cliente c ON c.cli_id=a.cli_id
                JOIN tb_usuario u ON u.usu_id=c.usu_id
                JOIN tb_servico s ON s.ser_id=a.ser_id
                JOIN tb_barbeiro b ON b.bar_id=a.bar_id
                JOIN tb_usuario ub ON ub.usu_id=b.usu_id WHERE age_id=$1
            `, [aviso.age_id]);
            const autorizado = aviso.tipo === 'DONO'
                ? process.env.WHATSAPP_OWNER_OPT_IN === 'true' && aviso.destino === telefoneBrasil(process.env.BARBEIRO_WHATSAPP)
                : dados?.age_whatsapp && dados.age_whatsapp_telefone === aviso.destino;
            if (!dados || !dados.futuro || !autorizado ||
                dados.age_aviso_versao !== aviso.versao ||
                !['AGENDADO','CONFIRMADO'].includes(dados.age_status)) {
                await query("UPDATE tb_whatsapp_fila SET status='DESCARTADO', atualizado_em=now() WHERE id=$1", [aviso.id]);
                continue;
            }
            const sid = await enviarModelo(aviso.tipo, aviso.destino, dados);
            await query("UPDATE tb_whatsapp_fila SET status='ACEITO', provedor_id=$2, atualizado_em=now() WHERE id=$1", [aviso.id, sid]);
        } catch (error) {
            const status = error.retry && aviso.tentativas < 3 ? 'PENDENTE'
                : error.definitivo ? 'FALHOU' : 'INCERTO';
            await query(`UPDATE tb_whatsapp_fila SET status=$2, erro=$3,
                atualizado_em=now(), tentar_em=now()+interval '1 minute' WHERE id=$1`,
                [aviso.id, status, String(error.message).slice(0, 160)]);
            console.error(`WhatsApp aviso ${aviso.id}: ${status}`);
        }
    }
}
