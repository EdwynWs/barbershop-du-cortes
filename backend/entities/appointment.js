export const statuses = [
    'AGENDADO',
    'CONFIRMADO',
    'EM_ATENDIMENTO',
    'CONCLUIDO',
    'CANCELADO',
    'NAO_COMPARECEU',
];
export const validDate = (v) =>
    /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v + 'T12:00:00Z'));
export const validTime = (v) => /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
export const minutes = (v) => Number(v.slice(0, 2)) * 60 + Number(v.slice(3, 5));
export const clock = (v) =>
    `${String(Math.floor(v / 60)).padStart(2, '0')}:${String(v % 60).padStart(2, '0')}`;
