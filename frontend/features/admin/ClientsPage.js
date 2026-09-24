'use client';
import { useState } from 'react';
import { FiSearch, FiChevronRight, FiCalendar, FiMessageCircle } from 'react-icons/fi';
import useApi from '../../hooks/useApi';
import { api, dateLabel, money, today } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import Photo from '../../components/ui/Photo';
import Modal from '../../components/ui/Modal';
import { Notice, Loading, Empty, Status } from '../../components/ui/Feedback';
import MetricCard from '../../components/admin/MetricCard';
import BookingForm from '../../components/admin/BookingForm';
export default function ClientsPage() {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('Todos');
    const clients = useApi(`/admin/clientes?busca=${encodeURIComponent(search)}`);
    const [detail, setDetail] = useState(null);
    const [booking, setBooking] = useState(false);
    const [error, setError] = useState('');
    const monthStart = today().slice(0, 7);
    const items = [...(clients.data || [])]
        .filter((item) =>
            filter === 'Novos'
                ? item.usu_data_cadastro.startsWith(monthStart)
                : filter === 'Inativos'
                  ? !item.ultima_visita ||
                    Date.now() - new Date(item.ultima_visita).getTime() > 30 * 86400000
                  : true
        )
        .sort((a, b) =>
            filter === 'Mais frequentes'
                ? b.atendimentos - a.atendimentos
                : a.usu_nome.localeCompare(b.usu_nome)
        );
    async function open(client) {
        try {
            setDetail(await api(`/admin/clientes/${client.cli_id}`));
        } catch (error) {
            setError(error.message);
        }
    }
    if (detail) {
        const completed = detail.historico.filter((item) => item.age_status === 'CONCLUIDO');
        const summary = clients.data?.find((item) => item.cli_id === detail.cli_id);
        return (
            <>
                <button className="back-button" onClick={() => setDetail(null)}>
                    ← Clientes
                </button>
                <PageHeader title="Perfil do cliente" />
                <div className="panel customer-profile">
                    <Photo person alt={detail.usu_nome} />
                    <div>
                        <h2>{detail.usu_nome}</h2>
                        <p>
                            {detail.usu_telefone}
                            <br />
                            {detail.usu_email}
                        </p>
                        <small>
                            Cliente desde {dateLabel(detail.usu_data_cadastro, { year: 'numeric' })}
                        </small>
                    </div>
                </div>
                <div className="metrics-revenue">
                    <MetricCard label="Total gasto" value={money(summary?.total_gasto)} />
                    <MetricCard label="Atendimentos" value={summary?.atendimentos || 0} />
                    <MetricCard
                        label="Ticket médio"
                        value={money(
                            summary?.atendimentos
                                ? Number(summary.total_gasto) / summary.atendimentos
                                : 0
                        )}
                    />
                </div>
                <div className="toolbar">
                    <button className="btn-red" onClick={() => setBooking(true)}>
                        <FiCalendar /> Agendar horário
                    </button>
                    {detail.usu_telefone && (
                        <a
                            className="btn-outline"
                            href={`https://wa.me/${detail.usu_telefone.replace(/\D/g, '').length > 11 ? detail.usu_telefone.replace(/\D/g, '') : '55' + detail.usu_telefone.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noreferrer"
                        >
                            <FiMessageCircle /> Enviar WhatsApp
                        </a>
                    )}
                </div>
                <h2 className="section-title">Histórico de atendimentos</h2>
                <div className="panel">
                    {detail.historico.length ? (
                        detail.historico.map((item) => (
                            <div className="receipt-row" key={item.age_id}>
                                <div>
                                    <strong>{item.ser_nome}</strong>
                                    <small>
                                        {dateLabel(item.age_data)} · {item.barbeiro}
                                    </small>
                                </div>
                                <div>
                                    <b>{money(item.age_valor)}</b>
                                    <Status value={item.age_status} />
                                </div>
                            </div>
                        ))
                    ) : (
                        <Empty>Nenhum atendimento ainda.</Empty>
                    )}
                </div>
                {booking && (
                    <Modal title="Agendar para este cliente" onClose={() => setBooking(false)}>
                        <BookingForm
                            clientId={detail.cli_id}
                            onSaved={() => {
                                setBooking(false);
                                open(detail);
                                clients.reload();
                            }}
                        />
                    </Modal>
                )}
            </>
        );
    }
    return (
        <>
            <PageHeader title="Clientes" subtitle="Conheça quem faz parte da sua barbearia." />
            <label className="search-field">
                <FiSearch />
                <input
                    placeholder="Buscar por nome, telefone ou email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </label>
            <div className="tabs">
                {['Todos', 'Mais frequentes', 'Novos', 'Inativos'].map((item) => (
                    <button
                        key={item}
                        className={item === filter ? 'active' : ''}
                        onClick={() => setFilter(item)}
                    >
                        {item}
                    </button>
                ))}
            </div>
            {filter === 'Inativos' && (
                <p className="muted small">Clientes sem visita nos últimos 30 dias.</p>
            )}
            <Notice>{error || clients.error}</Notice>
            {clients.loading ? (
                <Loading />
            ) : !items.length ? (
                <Empty>Nenhum cliente encontrado.</Empty>
            ) : (
                <div className="customer-list">
                    {items.map((item) => (
                        <button
                            className="customer-row"
                            key={item.cli_id}
                            onClick={() => open(item)}
                        >
                            <Photo person alt={item.usu_nome} />
                            <span className="list-copy">
                                <strong>{item.usu_nome}</strong>
                                <small>{item.usu_telefone || item.usu_email}</small>
                                <small>Última visita: {dateLabel(item.ultima_visita)}</small>
                            </span>
                            <span className="customer-value">
                                <b>{money(item.total_gasto)}</b>
                                <small>{item.atendimentos} atendimentos</small>
                            </span>
                            <FiChevronRight />
                        </button>
                    ))}
                </div>
            )}
        </>
    );
}
