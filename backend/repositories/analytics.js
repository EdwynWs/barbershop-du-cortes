import { query } from '../config/db.js';
import { movimentosFinanceiros } from './movimentosFinanceiros.js';

export async function dashboard() {
    // Uma consulta: todos os indicadores usam o mesmo instante/snapshot do banco.
    const sql = `
        WITH limites AS (
            SELECT (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::date AS hoje,
                date_trunc('month', CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::date AS inicio
        ),
        ${movimentosFinanceiros},
        movimentos_mes AS (
            SELECT m.* FROM movimentos m CROSS JOIN limites l
            WHERE m.dia BETWEEN l.inicio AND l.hoje
        ),
        resumo AS (
            SELECT COALESCE(SUM(faturamento), 0) AS receita,
                COALESCE(SUM(atendimentos), 0) AS quantidade,
                COALESCE(SUM(valor_servicos), 0) AS valor_servicos
            FROM movimentos_mes
        ),
        despesas AS (
            SELECT COALESCE(SUM(d.des_valor), 0) AS total
            FROM tb_despesa d CROSS JOIN limites l
            WHERE d.des_data BETWEEN l.inicio AND l.hoje
        ),
        dias AS (
            SELECT l.hoje - n AS dia FROM limites l CROSS JOIN generate_series(0, 6) n
        ),
        diario AS (
            SELECT to_char(d.dia, 'YYYY-MM-DD') AS dia,
                COALESCE(SUM(r.pag_valor), 0) AS total
            FROM dias d LEFT JOIN recebimentos r ON r.dia = d.dia
            GROUP BY d.dia
        ),
        meses AS (
            SELECT (l.inicio - n * INTERVAL '1 month')::date AS mes
            FROM limites l CROSS JOIN generate_series(0, 11) n
        ),
        mensal AS (
            SELECT to_char(m.mes, 'YYYY-MM') AS mes,
                COALESCE(SUM(r.pag_valor), 0) AS total
            FROM meses m LEFT JOIN recebimentos r
                ON r.dia >= m.mes AND r.dia < m.mes + INTERVAL '1 month'
            GROUP BY m.mes
        ),
        melhor_dia AS (
            SELECT to_char(dia, 'YYYY-MM-DD') AS dia,
                SUM(faturamento) AS faturamento, SUM(atendimentos) AS atendimentos
            FROM movimentos_mes GROUP BY dia HAVING SUM(faturamento) > 0
            ORDER BY faturamento DESC, dia DESC LIMIT 1
        ),
        carro_chefe AS (
            SELECT s.ser_id, s.ser_nome, SUM(m.atendimentos) AS quantidade,
                SUM(m.faturamento) AS faturamento
            FROM movimentos_mes m JOIN tb_servico s ON s.ser_id = m.ser_id
            GROUP BY s.ser_id, s.ser_nome HAVING SUM(m.atendimentos) > 0
            ORDER BY quantidade DESC, faturamento DESC, s.ser_id LIMIT 1
        ),
        pendencias AS (
            SELECT a.age_id,
                GREATEST(a.age_valor - COALESCE(SUM(r.pag_valor), 0), 0) AS saldo
            FROM tb_agendamento a CROSS JOIN limites l
            LEFT JOIN recebimentos r ON r.age_id = a.age_id
            WHERE a.age_status = 'CONCLUIDO' AND a.age_data <= l.hoje
            GROUP BY a.age_id, a.age_valor
        )
        SELECT json_build_object(
            'faturamentoTotal', (SELECT COALESCE(SUM(pag_valor), 0) FROM recebimentos),
            'faturamentoHoje', (SELECT COALESCE(SUM(r.pag_valor), 0) FROM recebimentos r, limites l WHERE r.dia = l.hoje),
            'faturamentoMes', resumo.receita,
            'atendimentosHoje', (SELECT COALESCE(SUM(m.atendimentos), 0) FROM movimentos_mes m, limites l WHERE m.dia = l.hoje),
            'atendimentosMes', resumo.quantidade,
            'valorServicosMes', resumo.valor_servicos,
            'ticketMedio', COALESCE(ROUND(resumo.valor_servicos / NULLIF(resumo.quantidade, 0), 2), 0),
            'novosClientes', (SELECT COUNT(*) FROM tb_usuario u, limites l
                WHERE u.usu_tipo = 'CLIENTE'
                    AND (u.usu_data_cadastro AT TIME ZONE 'America/Sao_Paulo')::date BETWEEN l.inicio AND l.hoje),
            'despesasMes', despesas.total,
            'lucroMes', resumo.receita - despesas.total,
            'saldoPendente', (SELECT COALESCE(SUM(saldo), 0) FROM pendencias),
            'ultimosDias', (SELECT json_agg(diario ORDER BY dia) FROM diario),
            'mensal', (SELECT json_agg(mensal ORDER BY mes) FROM mensal),
            'melhorDia', (SELECT row_to_json(melhor_dia) FROM melhor_dia),
            'carroChefe', (SELECT row_to_json(carro_chefe) FROM carro_chefe),
            'melhorBarbeiro', NULL,
            'avaliacaoMedia', 0
        ) AS dados
        FROM resumo CROSS JOIN despesas
    `;
    return (await query(sql)).rows[0].dados;
}
