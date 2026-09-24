import { query } from '../config/db.js';

export async function consultar(type, start, end) {
    const sql = {
        faturamento: `
                SELECT a.age_data AS periodo,
                    COUNT(DISTINCT a.age_id)::int AS atendimentos,
                    COALESCE(SUM(p.pag_valor),0)::numeric AS faturamento
                FROM tb_agendamento a
                LEFT JOIN tb_pagamento p ON p.age_id=a.age_id
                    AND p.pag_status='PAGO'
                WHERE a.age_status='CONCLUIDO'
                    AND a.age_data BETWEEN $1
                    AND $2
                GROUP BY 1
                ORDER BY 1
            `,
        servicos: `
                SELECT s.ser_nome,
                    COUNT(DISTINCT a.age_id)::int AS atendimentos,
                    COALESCE(SUM(p.pag_valor),0)::numeric AS faturamento
                FROM tb_servico s
                LEFT JOIN tb_agendamento a ON a.ser_id=s.ser_id
                    AND a.age_status='CONCLUIDO'
                    AND a.age_data BETWEEN $1
                    AND $2
                LEFT JOIN tb_pagamento p ON p.age_id=a.age_id
                    AND p.pag_status='PAGO'
                GROUP BY s.ser_id
                ORDER BY faturamento DESC
            `,
        barbeiros: `
                SELECT u.usu_nome,
                    COUNT(DISTINCT a.age_id)::int AS atendimentos,
                    COALESCE(SUM(p.pag_valor),0)::numeric AS faturamento,
                    ROUND(AVG(v.ava_nota)::numeric,1) AS avaliacao
                FROM tb_barbeiro b
                JOIN tb_usuario u ON u.usu_id=b.usu_id
                LEFT JOIN tb_agendamento a ON a.bar_id=b.bar_id
                    AND a.age_status='CONCLUIDO'
                    AND a.age_data BETWEEN $1
                    AND $2
                LEFT JOIN tb_pagamento p ON p.age_id=a.age_id
                    AND p.pag_status='PAGO'
                LEFT JOIN tb_avaliacao v ON v.age_id=a.age_id
                GROUP BY u.usu_id
                ORDER BY faturamento DESC
            `,
        clientes: `
                SELECT u.usu_nome,
                    COUNT(DISTINCT a.age_id)::int AS atendimentos,
                    COALESCE(SUM(p.pag_valor),0)::numeric AS total_gasto
                FROM tb_cliente c
                JOIN tb_usuario u ON u.usu_id=c.usu_id
                LEFT JOIN tb_agendamento a ON a.cli_id=c.cli_id
                    AND a.age_status='CONCLUIDO'
                    AND a.age_data BETWEEN $1
                    AND $2
                LEFT JOIN tb_pagamento p ON p.age_id=a.age_id
                    AND p.pag_status='PAGO'
                GROUP BY u.usu_id
                ORDER BY total_gasto DESC
                LIMIT 100
            `,
        horarios: `
                SELECT EXTRACT(ISODOW
                FROM age_data)::int AS dia_semana,
                    EXTRACT(HOUR
                FROM age_hora_inicio)::int AS hora,
                    COUNT(*)::int AS atendimentos
                FROM tb_agendamento
                WHERE age_status='CONCLUIDO'
                    AND age_data BETWEEN $1
                    AND $2
                GROUP BY 1,
                    2
                ORDER BY atendimentos DESC
            `,
    };

    return (await query(sql[type], [start, end])).rows;
}
