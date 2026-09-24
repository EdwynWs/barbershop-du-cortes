import { FiAlertCircle, FiCalendar } from 'react-icons/fi';
export function Notice({ children, success = false }) {
    if (!children) return null;
    return (
        <div role="status" className={`notice ${success ? 'notice-success' : ''}`}>
            <FiAlertCircle />
            {children}
        </div>
    );
}
export function Empty({ children = 'Nenhum registro encontrado.' }) {
    return (
        <div className="empty-state">
            <FiCalendar />
            <p>{children}</p>
        </div>
    );
}
export function Loading() {
    return (
        <div className="loading-state" role="status">
            <span className="spinner-border spinner-border-sm" /> Carregando...
        </div>
    );
}
export function Status({ value }) {
    const labels = {
        AGENDADO: 'Agendado',
        CONFIRMADO: 'Confirmado',
        EM_ATENDIMENTO: 'Em atendimento',
        CONCLUIDO: 'Concluído',
        CANCELADO: 'Cancelado',
        NAO_COMPARECEU: 'Não compareceu',
        PAGO: 'Pago',
    };
    return (
        <span className={`status status-${value?.toLowerCase()}`}>{labels[value] || value}</span>
    );
}
