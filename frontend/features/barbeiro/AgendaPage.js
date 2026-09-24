'use client';
import { useState } from 'react';
import useApi from '../../hooks/useApi';
import { api, dateLabel, today } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import { Notice, Loading, Empty, Status } from '../../components/ui/Feedback';
const transitions = {
    AGENDADO: [
        ['CONFIRMADO', 'Confirmar'],
        ['NAO_COMPARECEU', 'Não compareceu'],
    ],
    CONFIRMADO: [
        ['EM_ATENDIMENTO', 'Iniciar'],
        ['NAO_COMPARECEU', 'Não compareceu'],
    ],
    EM_ATENDIMENTO: [['CONCLUIDO', 'Finalizar']],
};
export default function BarberAgendaPage() {
    const appointments = useApi('/agendamentos/meus');
    const [date, setDate] = useState(today());
    const [error, setError] = useState('');
    const items = (appointments.data || []).filter((item) => item.age_data.slice(0, 10) === date);
    async function update(item, status) {
        try {
            await api(`/agendamentos/${item.age_id}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status }),
            });
            appointments.reload();
        } catch (error) {
            setError(error.message);
        }
    }
    return (
        <>
            <PageHeader
                title="Minha agenda"
                subtitle="Seu dia, seus clientes e seus atendimentos."
            />
            <label className="field-label">
                Data
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>
            <Notice>{error || appointments.error}</Notice>
            {appointments.loading ? (
                <Loading />
            ) : !items.length ? (
                <Empty>Nenhum atendimento neste dia.</Empty>
            ) : (
                <div className="agenda-list">
                    {items.map((item) => (
                        <article className="agenda-row" key={item.age_id}>
                            <div className="agenda-time">
                                <strong>{item.age_hora_inicio.slice(0, 5)}</strong>
                                <small>{dateLabel(item.age_data)}</small>
                            </div>
                            <div className="agenda-copy">
                                <h3>{item.cliente}</h3>
                                <p>{item.ser_nome}</p>
                            </div>
                            <Status value={item.age_status} />
                            {transitions[item.age_status] && (
                                <div className="agenda-actions">
                                    <select
                                        value=""
                                        aria-label="Alterar atendimento"
                                        onChange={(e) => update(item, e.target.value)}
                                    >
                                        <option value="">Ações</option>
                                        {transitions[item.age_status].map(([value, label]) => (
                                            <option key={value} value={value}>
                                                {label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </article>
                    ))}
                </div>
            )}
        </>
    );
}
