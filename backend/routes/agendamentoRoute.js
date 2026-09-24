import { Router } from 'express';
import * as controller from '../controllers/agendamentoController.js';
import { auth } from '../middlewares/auth.js';
import { wrap } from '../middlewares/error.js';
const router = Router();
router.use(auth);
router.post('/', wrap(controller.create));
router.get('/meus', wrap(controller.mine));
router.put('/:id/status', wrap(controller.change));
router.put(
    '/:id/cancelar',
    (req, res, next) => {
        req.body = { ...req.body, status: 'CANCELADO' };
        next();
    },
    wrap(controller.change)
);
export default router;
