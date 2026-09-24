export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function api(path, options = {}) {
    const isUpload = options.body instanceof FormData;
    const response = await fetch(`${API_URL}/api${path}`, {
        credentials: 'include',
        ...options,
        headers: {
            ...(isUpload ? {} : { 'Content-Type': 'application/json' }),
            ...options.headers,
        },
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) throw new Error(data?.erro || 'Não foi possível concluir a solicitação.');
    return data;
}

export function money(value) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
        Number(value) || 0
    );
}

export function today() {
    return new Intl.DateTimeFormat('sv-SE', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(new Date());
}

export function dateLabel(value, options = {}) {
    if (!value) return '—';
    const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', ...options });
}
