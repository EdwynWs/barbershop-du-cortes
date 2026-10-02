import 'dotenv/config';
import { pool } from './config/db.js';
import { sendDueReminders } from './services/reminders.js';

try {
    await sendDueReminders();
} catch (error) {
    console.error('Falha no processamento dos avisos:', error.code || error.message);
    process.exitCode = 1;
} finally {
    await pool.end();
}
