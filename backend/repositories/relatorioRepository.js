import { query } from '../config/db.js';
import { fail } from '../middlewares/error.js';
import { movimentosFinanceiros } from './movimentosFinanceiros.js';

export async function consultar(type, start, end) {
    // A seleção do SQL usa somente chaves internas, nunca texto recebido do usuário.
    const grupos = {
        faturamento: {
            campo: "to_char(m.dia, 'YYYY-MM-DD') AS periodo",
            join: '',
            grupo: 'm.dia',
            ordem: 'm.dia',
        },
        servicos: {
            campo: 's.ser_nome',
            join: 'JOIN tb_servico s ON s.ser_id = m.ser_id',
            grupo: 's.ser_id, s.ser_nome',
            ordem: 'faturamento DESC, s.ser_id',
        },
        barbeiros: {
            campo: 'u.usu_nome',
            join: 'JOIN tb_barbeiro b ON b.bar_id = m.bar_id JOIN tb_usuario u ON u.usu_id = b.usu_id',
            grupo: 'b.bar_id, u.usu_nome',
            ordem: 'faturamento DESC, b.bar_id',
        },
        clientes: {
            campo: 'u.usu_nome',
            join: 'JOIN tb_cliente c ON c.cli_id = m.cli_id JOIN tb_usuario u ON u.usu_id = c.usu_id',
            grupo: 'c.cli_id, u.usu_nome',
            ordem: 'faturamento DESC, c.cli_id',
        },
    };
    if (type === 'horarios') {
        return (
            await query(
                `
            SELECT EXTRACT(ISODOW FROM age_data)::int AS dia_semana,
                EXTRACT(HOUR FROM age_hora_inicio)::int AS hora,
                COUNT(*)::int AS atendimentos, SUM(age_valor)::numeric AS valor_servicos
            FROM tb_agendamento
            WHERE age_status = 'CONCLUIDO' AND age_data BETWEEN $1::date AND $2::date
            GROUP BY 1, 2 ORDER BY atendimentos DESC, dia_semana, hora
        `,
                [start, end]
            )
        ).rows;
    }
    const grupo = Object.hasOwn(grupos, type) ? grupos[type] : null;
    if (!grupo) fail('Relatório desconhecido.', 404);
    return (
        await query(
            `
        WITH ${movimentosFinanceiros}
        SELECT ${grupo.campo},
            SUM(m.atendimentos)::int AS atendimentos,
            SUM(m.valor_servicos)::numeric AS valor_servicos,
            SUM(m.faturamento)::numeric AS faturamento
        FROM movimentos m ${grupo.join}
        WHERE m.dia BETWEEN $1::date AND $2::date
        GROUP BY ${grupo.grupo}
        ORDER BY ${grupo.ordem}
    `,
            [start, end]
        )
    ).rows;
}
