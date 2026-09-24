import 'dotenv/config';
import bcrypt from 'bcrypt';
import { pool } from '../config/db.js';
const c = await pool.connect();
try {
    await c.query('BEGIN');
    const hash = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'Admin123456!', 12);
    await c.query(
        "INSERT INTO tb_usuario(usu_nome,usu_email,usu_senha,usu_tipo) VALUES('Du Cortes',$1,$2,'ADMIN') ON CONFLICT(usu_email) DO NOTHING",
        [process.env.ADMIN_EMAIL || 'admin@ducortes.com.br', hash]
    );
    const services = [
        ['Corte de Cabelo', 40, 45],
        ['Barba', 30, 30],
        ['Corte + Barba', 60, 75],
        ['Sobrancelha', 20, 20],
        ['Pigmentação', 50, 45],
        ['Tratamento Capilar', 80, 60],
    ];
    for (const [name, price, duration] of services)
        await c.query(
            `
                INSERT INTO tb_servico(ser_nome,ser_valor,ser_duracao) SELECT $1,
                    $2,
                    $3
                WHERE NOT EXISTS(SELECT 1
                FROM tb_servico
                WHERE ser_nome=$1)
            `,
            [name, price, duration]
        );
    const { rows: sv } = await c.query(
        'SELECT ser_id,ser_valor,ser_duracao FROM tb_servico ORDER BY ser_id LIMIT 6'
    );
    const barbers = [];
    for (let i = 0; i < 4; i++) {
        const email = `barbeiro${i + 1}@ducortes.com.br`;
        let {
            rows: [u],
        } = await c.query(
            `
                INSERT INTO tb_usuario(usu_nome,usu_email,usu_senha,usu_tipo)
                VALUES($1,$2,$3,'BARBEIRO') ON CONFLICT(usu_email) DO UPDATE
                SET usu_email=EXCLUDED.usu_email
                RETURNING usu_id
            `,
            [['Lucas', 'Rafael', 'Mateus', 'Gustavo'][i], email, hash]
        );
        let {
            rows: [b],
        } = await c.query(
            `
                INSERT INTO tb_barbeiro(usu_id,bar_descricao)
                VALUES($1,$2) ON CONFLICT(usu_id) DO UPDATE
                SET bar_descricao=EXCLUDED.bar_descricao
                RETURNING bar_id
            `,
            [u.usu_id, 'Especialista em estilo e cuidado masculino']
        );
        barbers.push(b.bar_id);
        for (const s of sv)
            await c.query('INSERT INTO tb_barbeiro_servico VALUES($1,$2) ON CONFLICT DO NOTHING', [
                b.bar_id,
                s.ser_id,
            ]);
        for (let day = 1; day <= 6; day++)
            await c.query(
                `
                    INSERT INTO tb_horario_barbeiro(bar_id,hor_dia_semana,hor_inicio,hor_fim,hor_intervalo_inicio,hor_intervalo_fim)
                    VALUES($1,$2,'09:00','19:00','12:00','13:00') ON CONFLICT(bar_id,hor_dia_semana) DO NOTHING
                `,
                [b.bar_id, day]
            );
    }
    const clients = [];
    for (let i = 1; i <= 20; i++) {
        const {
            rows: [u],
        } = await c.query(
            `
                INSERT INTO tb_usuario(usu_nome,usu_email,usu_senha,usu_tipo,usu_telefone)
                VALUES($1,$2,$3,'CLIENTE',$4) ON CONFLICT(usu_email) DO UPDATE
                SET usu_email=EXCLUDED.usu_email
                RETURNING usu_id
            `,
            [
                `Cliente ${i}`,
                `cliente${i}@exemplo.com`,
                hash,
                `1499666${String(i).padStart(4, '0')}`,
            ]
        );
        const {
            rows: [cl],
        } = await c.query(
            'INSERT INTO tb_cliente(usu_id) VALUES($1) ON CONFLICT(usu_id) DO UPDATE SET usu_id=EXCLUDED.usu_id RETURNING cli_id',
            [u.usu_id]
        );
        clients.push(cl.cli_id);
    }
    const {
        rows: [existing],
    } = await c.query('SELECT COUNT(*)::int AS count FROM tb_agendamento');
    if (!existing.count) {
        for (let i = 0; i < 70; i++) {
            const date = new Date(Date.now() - i * 86400000);
            const day = date.getUTCDay();
            if (day === 0) continue;
            const d = date.toISOString().slice(0, 10),
                hour = 9 + (i % 8),
                ser = sv[i % sv.length],
                bar = barbers[i % 4],
                cli = clients[i % 20];
            const {
                rows: [a],
            } = await c.query(
                `
                    INSERT INTO tb_agendamento(cli_id,bar_id,ser_id,age_data,age_hora_inicio,age_hora_fim,age_valor,age_status)
                    VALUES($1,$2,$3,$4,$5,$6,$7,'CONCLUIDO')
                    RETURNING age_id
                `,
                [
                    cli,
                    bar,
                    ser.ser_id,
                    d,
                    `${String(hour).padStart(2, '0')}:00`,
                    `${String(hour + Math.ceil(ser.ser_duracao / 60)).padStart(2, '0')}:00`,
                    ser.ser_valor,
                ]
            );
            await c.query(
                `
                    INSERT INTO tb_pagamento(age_id,pag_valor,pag_forma,pag_status,pag_data)
                    VALUES($1,$2,'PIX','PAGO',$3::date + interval '12 hours')
                `,
                [a.age_id, ser.ser_valor, d]
            );
            if (i % 3 === 0)
                await c.query(
                    'INSERT INTO tb_avaliacao(age_id,cli_id,bar_id,ava_nota) VALUES($1,$2,$3,$4)',
                    [a.age_id, cli, bar, 4 + (i % 2)]
                );
        }
    }
    await c.query(
        `
            INSERT INTO tb_despesa(des_descricao,des_categoria,des_valor,des_data) SELECT 'Produtos',
                'Produtos',
                250,
                current_date
            WHERE NOT EXISTS(SELECT 1
            FROM tb_despesa)
        `
    );
    await c.query('COMMIT');
    console.log('Seed concluído; senhas dos usuários de demonstração são ADMIN_PASSWORD');
} catch (e) {
    await c.query('ROLLBACK');
    console.error(e);
    process.exitCode = 1;
} finally {
    c.release();
    await pool.end();
}
