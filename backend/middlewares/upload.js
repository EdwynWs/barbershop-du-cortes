import multer from 'multer';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

// Mantém compatibilidade com a configuração atual do app.js.
export const uploadDirectory = fileURLToPath(
    new URL('../uploads/', import.meta.url)
);

mkdirSync(uploadDirectory, { recursive: true });

const formatosPermitidos = [
    'image/jpeg',
    'image/png',
    'image/webp',
];

export const upload = multer({
    storage: multer.memoryStorage(),

    limits: {
        fileSize: 3 * 1024 * 1024,
    },

    fileFilter(req, file, done) {
        done(null, formatosPermitidos.includes(file.mimetype));
    },
});