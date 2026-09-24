import multer from 'multer';
import crypto from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
export const uploadDirectory = fileURLToPath(new URL('../uploads/', import.meta.url));
mkdirSync(uploadDirectory, { recursive: true });
const extensions = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
export const upload = multer({
    storage: multer.diskStorage({
        destination: uploadDirectory,
        filename(req, file, done) {
            done(null, crypto.randomUUID() + extensions[file.mimetype]);
        },
    }),
    limits: { fileSize: 3 * 1024 * 1024 },
    fileFilter(req, file, done) {
        done(null, Boolean(extensions[file.mimetype]));
    },
});
