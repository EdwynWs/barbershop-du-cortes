'use client';
import { useState } from 'react';
import Link from 'next/link';
import { FiClock, FiCalendar, FiStar } from 'react-icons/fi';
import useApi from '../../hooks/useApi';
import { api, dateLabel, money } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import { Notice, Empty, Loading, Status } from '../../components/ui/Feedback';
export default function AppointmentsPage() {
    const { data, error, loading, reload } = useApi('/agendamentos/meus');
    const [tab, setTab] = useState('Próximos');
    const [message, setMessage] = useState('');
    const [cancel, setCancel] = useState(null);
    const [review, setReview] = useState(null);
    const [score, setScore] = useState(5);
    const [comment, setComment] = useState('');
    const [busy, setBusy] = useState(false);
    const active = ['AGENDADO', 'CONFIRMADO', 'EM_ATENDIMENTO'];
    const items = (data || []).filter((item) =>
        tab === 'Próximos' ? active.includes(item.age_status) : !active.includes(item.age_status)
    );
    async function submit(path, body, method) {
        setBusy(true);
        try {
            await api(path, { method, body: JSON.stringify(body) });
            setCancel(null);
            setReview(null);
            setMessage('Pronto! Sua solicitação foi registrada.');
            reload();
        } catch (error) {
            setMessage(error.message);
        } finally {
            setBusy(false);
        }
    }
    return (
        <div className="client-narrow">
            <PageHeader
                title="Meus agendamentos"
                subtitle="Seu próximo visual já tem hora marcada."
            />
            <div className="tabs tabs-equal">
                {['Próximos', 'Histórico'].map((item) => (
                    <button
                        key={item}
                        className={tab === item ? 'active red' : ''}
                        onClick={() => setTab(item)}
                    >
                        {item}
                    </button>
                ))}
            </div>
            <Notice>{message || error}</Notice>
            {loading ? (
                <Loading />
            ) : !items.length ? (
                <Empty>Nenhum agendamento nesta lista.</Empty>
            ) : (
                items.map((item) => (
                    <article className="panel appointment-card" key={item.age_id}>
                        <div className="appointment-main">
                            <div className="date-tile">
                                <small>
                                    {dateLabel(item.age_data, { weekday: 'short' }).split(',')[0]}
                                </small>
                                <strong>{item.age_data.slice(8, 10)}</strong>
                                <small>{dateLabel(item.age_data).split(' ')[2]}</small>
                            </div>
                            <div className="appointment-copy">
                                <div className="inline-between">
                                    <h3>{item.ser_nome}</h3>
                                    <Status value={item.age_status} />
                                </div>
                                <p>{item.barbeiro}</p>
                                <span>
                                    <FiClock /> {item.age_hora_inicio.slice(0, 5)} ·{' '}
                                    {money(item.age_valor)}
                                </span>
                            </div>
                        </div>
                        {['AGENDADO', 'CONFIRMADO'].includes(item.age_status) && (
                            <button className="card-action" onClick={() => setCancel(item)}>
                                Cancelar agendamento
                            </button>
                        )}
                        {item.age_status === 'CONCLUIDO' && (
                            <button className="card-action" onClick={() => setReview(item)}>
                                <FiStar /> Avaliar atendimento
                            </button>
                        )}
                    </article>
                ))
            )}
            <div className="panel schedule-prompt">
                <h2>ESTILO SEMPRE EM DIA.</h2>
                <p>Agende seu próximo horário.</p>
                <Link className="btn-outline" href="/cliente/agendar">
                    <FiCalendar /> Agendar novamente
                </Link>
            </div>
            {cancel && (
                <Modal title="Cancelar agendamento?" onClose={() => setCancel(null)}>
                    <p>
                        {cancel.ser_nome} · {dateLabel(cancel.age_data)} às{' '}
                        {cancel.age_hora_inicio.slice(0, 5)}
                    </p>
                    <p>O cancelamento é permitido até duas horas antes.</p>
                    <button
                        className="btn-red full-width"
                        disabled={busy}
                        onClick={() => submit(`/agendamentos/${cancel.age_id}/cancelar`, {}, 'PUT')}
                    >
                        Confirmar cancelamento
                    </button>
                </Modal>
            )}
            {review && (
                <Modal title="Como foi seu atendimento?" onClose={() => setReview(null)}>
                    <div className="star-picker">
                        {[1, 2, 3, 4, 5].map((value) => (
                            <button
                                key={value}
                                aria-label={`${value} estrelas`}
                                className={value <= score ? 'active' : ''}
                                onClick={() => setScore(value)}
                            >
                                ★
                            </button>
                        ))}
                    </div>
                    <textarea
                        placeholder="Conte como foi (opcional)"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                    />
                    <button
                        className="btn-red full-width"
                        disabled={busy}
                        onClick={() =>
                            submit(
                                '/avaliacoes',
                                { agendamentoId: review.age_id, nota: score, comentario: comment },
                                'POST'
                            )
                        }
                    >
                        Enviar avaliação
                    </button>
                </Modal>
            )}
        </div>
    );
}
