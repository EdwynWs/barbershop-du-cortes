// Base compartilhada: recebimentos e atendimentos são movimentos diferentes.
// Cada pagamento soma receita; cada atendimento concluído conta apenas uma vez.
export const movimentosFinanceiros = `
    recebimentos AS (
        SELECT p.pag_id, p.age_id, p.pag_valor,
            (p.pag_data AT TIME ZONE 'America/Sao_Paulo')::date AS dia,
            a.ser_id, a.bar_id, a.cli_id
        FROM tb_pagamento p
        JOIN tb_agendamento a ON a.age_id = p.age_id
        WHERE p.pag_status = 'PAGO' AND a.age_status = 'CONCLUIDO'
            AND p.pag_data <= CURRENT_TIMESTAMP
    ),
    movimentos AS (
        SELECT r.dia, r.ser_id, r.bar_id, r.cli_id,
            r.pag_valor AS faturamento, 0::integer AS atendimentos,
            0::numeric AS valor_servicos, NULL::time AS hora
        FROM recebimentos r
        UNION ALL
        SELECT a.age_data, a.ser_id, a.bar_id, a.cli_id,
            0::numeric, 1::integer, a.age_valor, a.age_hora_inicio
        FROM tb_agendamento a
        WHERE a.age_status = 'CONCLUIDO'
    )
`;
