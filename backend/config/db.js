import pg from 'pg';

export const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,

    ssl: process.env.DATABASE_URL?.includes('sslmode=require')
        ? { rejectUnauthorized: false }
        : undefined,

    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    query_timeout: 15000,
});

pool.on('error', (error) => {
    console.error('[PostgreSQL] Erro em conexão ociosa:', {
        code: error.code,
        message: error.message,
    });
});

export const query = (sql, params = []) => pool.query(sql, params);
