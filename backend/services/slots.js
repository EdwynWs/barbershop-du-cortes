import { query } from '../config/db.js';
import { validDate, minutes, clock } from '../entities/appointment.js';
import { fail } from '../middlewares/error.js';
// Business time is America/Sao_Paulo. TIME columns deliberately store local wall time.
export async function slots(barId, serId, date, ignoreId = null) {
    if (!validDate(date)) fail('Data inválida');
    const {
        rows: [s],
    } = await query('SELECT ser_duracao FROM tb_servico WHERE ser_id=$1 AND ser_ativo', [serId]);
    if (!s) fail('Serviço indisponível', 404);
    const weekday = new Date(date + 'T12:00:00Z').getUTCDay();
    const {
        rows: [h],
    } = await query(
        'SELECT * FROM tb_horario_barbeiro WHERE bar_id=$1 AND hor_dia_semana=$2 AND hor_ativo',
        [barId, weekday]
    );
    if (!h) return [];
    const { rows: appointments } = await query(
        `
            SELECT age_hora_inicio::text,
                age_hora_fim::text
            FROM tb_agendamento
            WHERE bar_id=$1
                AND age_data=$2
                AND age_status NOT IN ('CANCELADO','NAO_COMPARECEU')
                AND ($3::bigint IS NULL OR age_id<>$3)
        `,
        [barId, date, ignoreId]
    );
    const { rows: blocks } = await query(
        `
            SELECT (blo_inicio AT TIME ZONE 'America/Sao_Paulo')::time::text AS inicio,
                (blo_fim AT TIME ZONE 'America/Sao_Paulo')::time::text AS fim
            FROM tb_bloqueio_barbeiro
            WHERE bar_id=$1
                AND blo_inicio < (($2::date+interval '1 day') AT TIME ZONE 'America/Sao_Paulo')
                AND blo_fim > ($2::date AT TIME ZONE 'America/Sao_Paulo')
        `,
        [barId, date]
    );
    const today = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(new Date());
    const now = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'America/Sao_Paulo',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).format(new Date());
    if (date < today) return [];
    const intervals = [
        ...appointments.map((a) => [minutes(a.age_hora_inicio), minutes(a.age_hora_fim)]),
        ...blocks.map((b) => [minutes(b.inicio), minutes(b.fim)]),
    ];
    if (h.hor_intervalo_inicio)
        intervals.push([minutes(h.hor_intervalo_inicio), minutes(h.hor_intervalo_fim)]);
    const result = [];
    for (let m = minutes(h.hor_inicio); m + s.ser_duracao <= minutes(h.hor_fim); m += 30) {
        if (date === today && m <= minutes(now)) continue;
        if (intervals.some(([a, b]) => m < b && m + s.ser_duracao > a)) continue;
        result.push(clock(m));
    }
    return result;
}
