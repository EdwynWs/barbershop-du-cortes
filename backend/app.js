import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import routes from './routes/index.js';
import { errors } from './middlewares/error.js';
import spec from './swagger.js';
import { uploadDirectory } from './middlewares/upload.js';
const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(
    '/uploads',
    (req, res, next) => {
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        next();
    },
    express.static(uploadDirectory)
);
app.use(
    '/api/auth',
    rateLimit({
        windowMs: 15 * 60 * 1000,
        limit: 40,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
    })
);
app.use('/api', routes);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(spec));
app.use(errors);
export default app;
