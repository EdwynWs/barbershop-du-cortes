'use client';
import { useState } from 'react';
import { FiPlus, FiCalendar } from 'react-icons/fi';
import useApi from '../../hooks/useApi';
import { api, today, dateLabel } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import Photo from '../../components/ui/Photo';
import { Notice, Loading, Empty, Status } from '../../components/ui/Feedback';
import PeriodFilter from '../../components/admin/PeriodFilter';
import BookingForm from '../../components/admin/BookingForm';

const transitions = {
    AGENDADO: [
        ['CONFIRMADO', 'Confirmar'],
        ['CANCELADO', 'Cancelar'],
        ['NAO_COMPARECEU', 'Não compareceu'],
    ],
    CONFIRMADO: [
        ['EM_ATENDIMENTO', 'Iniciar atendimento'],
        ['CANCELADO', 'Cancelar'],
        ['NAO_COMPARECEU', 'Não compareceu'],
    ],
    EM_ATENDIMENTO: [['CONCLUIDO', 'Finalizar atendimento']],
};
export default function AgendaPage() {
    const [period, setPeriod] = useState({ inicio: today(), fim: today() });
    const [barber, setBarber] = useState('');
    const barbers = useApi('/barbeiros');
    const appointments = useApi(
        `/admin/agenda?inicio=${period.inicio}&fim=${period.fim}${barber ? '&barbeiro=' + barber : ''}`
    );
    const [creating, setCreating] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ data: '', hora: '' });
    const [message, setMessage] = useState('');
    async function status(item, value) {
        try {
            await api(`/agendamentos/${item.age_id}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status: value }),
            });
            appointments.reload();
        } catch (error) {
            setMessage(error.message);
        }
    }
    async function reschedule(event) {
        event.preventDefault();
        try {
            await api(`/admin/agendamentos/${editing.age_id}`, {
                method: 'PUT',
                body: JSON.stringify(form),
            });
            setEditing(null);
            appointments.reload();
        } catch (error) {
            setMessage(error.message);
        }
    }
    return (
        <>
            <PageHeader
                title="Agenda"
                subtitle="Todos os horários, em um só lugar."
                action={
                    <button className="btn-red" onClick={() => setCreating(true)}>
                        <FiPlus /> Novo agendamento
                    </button>
                }
            />
            <PeriodFilter value={period} onChange={setPeriod} />
            <div className="tabs barber-filter">
                <button className={!barber ? 'active red' : ''} onClick={() => setBarber('')}>
                    Todos
                </button>
                {barbers.data?.map((item) => (
                    <button
                        key={item.bar_id}
                        className={barber === item.bar_id ? 'active' : ''}
                        onClick={() => setBarber(item.bar_id)}
                    >
                        {item.usu_nome}
                    </button>
                ))}
            </div>
            <Notice>{message || appointments.error}</Notice>
            {appointments.loading ? (
                <Loading />
            ) : !appointments.data?.length ? (
                <Empty>Nenhum atendimento neste período.</Empty>
            ) : (
                <div className="agenda-list">
                    {appointments.data.map((item) => (
                        <article className="agenda-row" key={item.age_id}>
                            <div className="agenda-time">
                                <strong>{item.age_hora_inicio.slice(0, 5)}</strong>
                                <small>{dateLabel(item.age_data)}</small>
                            </div>
                            <Photo person alt={item.cliente} />
                            <div className="agenda-copy">
                                <h3>{item.cliente}</h3>
                                <p>
                                    {item.ser_nome} <span>· {item.barbeiro}</span>
                                </p>
                            </div>
                            <Status value={item.age_status} />
                            <div className="agenda-actions">
                                {transitions[item.age_status] && (
                                    <select
                                        aria-label={`Alterar atendimento de ${item.cliente}`}
                                        value=""
                                        onChange={(e) => status(item, e.target.value)}
                                    >
                                        <option value="">Ações</option>
                                        {transitions[item.age_status].map(([value, label]) => (
                                            <option key={value} value={value}>
                                                {label}
                                            </option>
                                        ))}
                                    </select>
                                )}
                                {['AGENDADO', 'CONFIRMADO'].includes(item.age_status) && (
                                    <button
                                        className="icon-button"
                                        aria-label="Reagendar"
                                        onClick={() => {
                                            setEditing(item);
                                            setForm({
                                                data: item.age_data.slice(0, 10),
                                                hora: item.age_hora_inicio.slice(0, 5),
                                            });
                                        }}
                                    >
                                        <FiCalendar />
                                    </button>
                                )}
                            </div>
                        </article>
                    ))}
                </div>
            )}
            {creating && (
                <Modal title="Novo agendamento" onClose={() => setCreating(false)}>
                    <BookingForm
                        onSaved={() => {
                            setCreating(false);
                            appointments.reload();
                        }}
                    />
                </Modal>
            )}
            {editing && (
                <Modal title="Reagendar atendimento" onClose={() => setEditing(null)}>
                    <Notice>{message}</Notice>
                    <form onSubmit={reschedule}>
                        <p>
                            {editing.cliente} · {editing.ser_nome}
                        </p>
                        <label className="field-label">
                            Data
                            <input
                                type="date"
                                min={today()}
                                required
                                value={form.data}
                                onChange={(e) => setForm({ ...form, data: e.target.value })}
                            />
                        </label>
                        <label className="field-label">
                            Horário
                            <input
                                type="time"
                                required
                                value={form.hora}
                                onChange={(e) => setForm({ ...form, hora: e.target.value })}
                            />
                        </label>
                        <button className="btn-red full-width">Salvar novo horário</button>
                    </form>
                </Modal>
            )}
        </>
    );
}
