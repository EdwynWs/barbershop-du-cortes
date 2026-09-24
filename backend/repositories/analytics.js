import { query } from '../config/db.js';
const income = `FROM tb_pagamento p JOIN tb_agendamento a ON a.age_id=p.age_id WHERE p.pag_status='PAGO' AND a.age_status='CONCLUIDO'`;
export async function dashboard() {
    const [summary, daily, monthly, best, top, barber, expenses, counts, rating, newClients] =
        await Promise.all([
            query(
                `
                    SELECT COALESCE(SUM(p.pag_valor),0)::numeric AS total,
                        COALESCE(SUM(p.pag_valor) FILTER(
                    WHERE (p.pag_data AT TIME ZONE 'America/Sao_Paulo')::date=(CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::date),0) AS today
                    FROM tb_pagamento p
                    JOIN tb_agendamento a ON a.age_id=p.age_id
                    WHERE p.pag_status='PAGO'
                        AND a.age_status='CONCLUIDO'
                `
            ),
            query(
                `
                    SELECT (p.pag_data AT TIME ZONE 'America/Sao_Paulo')::date AS dia,
                        SUM(p.pag_valor)::numeric AS total ${income}
                        AND p.pag_data>=now()-interval '7 days'
                    GROUP BY 1
                    ORDER BY 1
                `
            ),
            query(
                `
                    SELECT to_char(p.pag_data AT TIME ZONE 'America/Sao_Paulo','YYYY-MM') AS mes,
                        SUM(p.pag_valor)::numeric AS total ${income}
                        AND p.pag_data>=date_trunc('month',now())-interval '11 months'
                    GROUP BY 1
                    ORDER BY 1
                `
            ),
            query(
                `
                    SELECT (p.pag_data AT TIME ZONE 'America/Sao_Paulo')::date AS dia,
                        SUM(p.pag_valor)::numeric AS faturamento,
                        COUNT(DISTINCT a.age_id)::int AS atendimentos ${income}
                        AND p.pag_data>=date_trunc('month',now() AT TIME ZONE 'America/Sao_Paulo') AT TIME ZONE 'America/Sao_Paulo'
                    GROUP BY 1
                    ORDER BY faturamento DESC
                    LIMIT 1
                `
            ),
            query(
                `
                    SELECT s.ser_id,
                        s.ser_nome,
                        COUNT(DISTINCT a.age_id)::int AS quantidade,
                        COALESCE(SUM(p.pag_valor),0)::numeric AS faturamento
                    FROM tb_agendamento a
                    JOIN tb_servico s ON s.ser_id=a.ser_id
                    LEFT JOIN tb_pagamento p ON p.age_id=a.age_id
                        AND p.pag_status='PAGO'
                    WHERE a.age_status='CONCLUIDO'
                    GROUP BY s.ser_id
                    ORDER BY quantidade DESC
                    LIMIT 1
                `
            ),
            query(
                `
                    SELECT u.usu_nome,
                        COUNT(DISTINCT a.age_id)::int AS atendimentos,
                        COALESCE(SUM(p.pag_valor),0)::numeric AS faturamento
                    FROM tb_agendamento a
                    JOIN tb_barbeiro b ON b.bar_id=a.bar_id
                    JOIN tb_usuario u ON u.usu_id=b.usu_id
                    LEFT JOIN tb_pagamento p ON p.age_id=a.age_id
                        AND p.pag_status='PAGO'
                    WHERE a.age_status='CONCLUIDO'
                    GROUP BY u.usu_id
                    ORDER BY faturamento DESC
                    LIMIT 1
                `
            ),
            query(
                `
                    SELECT COALESCE(SUM(des_valor),0)::numeric AS total
                    FROM tb_despesa
                    WHERE des_data>=date_trunc('month',now() AT TIME ZONE 'America/Sao_Paulo')::date
                `
            ),
            query(
                `
                    SELECT COUNT(*) FILTER(
                    WHERE age_data=(now() AT TIME ZONE 'America/Sao_Paulo')::date AND age_status='CONCLUIDO')::int AS hoje,
                        COUNT(*) FILTER(
                    WHERE age_data>=date_trunc('month',now() AT TIME ZONE 'America/Sao_Paulo')::date AND age_status='CONCLUIDO')::int AS mes
                    FROM tb_agendamento
                `
            ),
            query('SELECT ROUND(AVG(ava_nota)::numeric,1) AS media FROM tb_avaliacao'),
            query(
                `
                    SELECT COUNT(*)::int AS total
                    FROM tb_usuario
                    WHERE usu_tipo='CLIENTE'
                        AND usu_data_cadastro >= date_trunc('month',now() AT TIME ZONE 'America/Sao_Paulo') AT TIME ZONE 'America/Sao_Paulo'
                `
            ),
        ]);
    const total = Number(summary.rows[0].total),
        month =
            monthly.rows.at(-1)?.mes ===
            new Intl.DateTimeFormat('sv-SE', {
                timeZone: 'America/Sao_Paulo',
                year: 'numeric',
                month: '2-digit',
            })
                .format(new Date())
                ?.slice(0, 7)
                ? Number(monthly.rows.at(-1).total)
                : 0;
    return {
        faturamentoTotal: total,
        faturamentoHoje: Number(summary.rows[0].today),
        faturamentoMes: month,
        atendimentosHoje: counts.rows[0].hoje,
        atendimentosMes: counts.rows[0].mes,
        ticketMedio: counts.rows[0].mes ? month / counts.rows[0].mes : 0,
        avaliacaoMedia: Number(rating.rows[0].media || 0),
        novosClientes: newClients.rows[0].total,
        despesasMes: Number(expenses.rows[0].total),
        lucroMes: month - Number(expenses.rows[0].total),
        ultimosDias: daily.rows,
        mensal: monthly.rows,
        melhorDia: best.rows[0] || null,
        carroChefe: top.rows[0] || null,
        melhorBarbeiro: barber.rows[0] || null,
    };
}
