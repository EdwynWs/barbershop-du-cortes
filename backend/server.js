import 'dotenv/config';
import app from './app.js';
import { startReminders } from './services/reminders.js';
if (!process.env.DATABASE_URL || !process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
    throw new Error('Defina DATABASE_URL e JWT_SECRET de 32+ caracteres');
app.listen(process.env.PORT || 4000, () => console.log(`API na porta ${process.env.PORT || 4000}`));
startReminders();
