'use client';
import { FiBell, FiCheck } from 'react-icons/fi';
import useApi from '../../hooks/useApi';
import { api, dateLabel } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import { Notice, Loading, Empty } from '../../components/ui/Feedback';
export default function NotificationsPage() {
    const { data, loading, error, reload } = useApi('/notificacoes');
    return (
        <div className="client-narrow">
            <PageHeader title="Notificações" back="/cliente/perfil" />
            <Notice>{error}</Notice>
            {loading ? (
                <Loading />
            ) : !data?.length ? (
                <Empty>Você está em dia. Nenhuma notificação por aqui.</Empty>
            ) : (
                data.map((item) => (
                    <button
                        key={item.not_id}
                        className={`list-card notification-card ${item.not_lida ? 'is-read' : ''}`}
                        onClick={async () => {
                            await api(`/notificacoes/${item.not_id}`, { method: 'PATCH' });
                            reload();
                        }}
                    >
                        <span className="notification-icon">
                            {item.not_lida ? <FiCheck /> : <FiBell />}
                        </span>
                        <span className="list-copy">
                            <strong>{item.not_titulo}</strong>
                            <small>{item.not_mensagem}</small>
                            <small>{dateLabel(item.not_data)}</small>
                        </span>
                        {!item.not_lida && <span className="unread-dot" />}
                    </button>
                ))
            )}
        </div>
    );
}
