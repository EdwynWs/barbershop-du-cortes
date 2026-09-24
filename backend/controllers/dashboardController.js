import { dashboard } from '../repositories/analytics.js';
export async function resumo(req, res) {
    res.json(await dashboard());
}
export async function faturamentoTotal(req, res) {
    res.json({ faturamentoTotal: (await dashboard()).faturamentoTotal });
}
export async function carroChefe(req, res) {
    res.json((await dashboard()).carroChefe);
}
export async function melhorDia(req, res) {
    res.json((await dashboard()).melhorDia);
}
