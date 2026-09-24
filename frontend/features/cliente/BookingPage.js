'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
    FiArrowLeft,
    FiArrowRight,
    FiCheck,
    FiScissors,
    FiUser,
    FiCalendar,
    FiClock,
    FiCreditCard,
} from 'react-icons/fi';
import useApi from '../../hooks/useApi';
import { api, money, dateLabel } from '../../services/api';
import ServiceList from '../../components/cliente/ServiceList';
import BarberList from '../../components/cliente/BarberList';
import Calendar from '../../components/cliente/Calendar';
import PageHeader from '../../components/ui/PageHeader';
import { Notice, Loading, Empty } from '../../components/ui/Feedback';

const stepNames = ['Serviço', 'Barbeiro', 'Data', 'Horário', 'Confirmar'];
export default function BookingPage() {
    const services = useApi('/servicos');
    const barbers = useApi('/barbeiros');
    const [step, setStep] = useState(1);
    const [form, setForm] = useState({
        servicoId: '',
        barbeiroId: '',
        data: '',
        hora: '',
        observacao: '',
    });
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [complete, setComplete] = useState(false);
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        setForm((form) => ({
            ...form,
            servicoId: params.get('servico') || '',
            barbeiroId: params.get('barbeiro') || '',
        }));
    }, []);
    const service = services.data?.find((item) => String(item.ser_id) === String(form.servicoId));
    const barber = barbers.data?.find((item) => String(item.bar_id) === String(form.barbeiroId));
    const eligible = (barbers.data || []).filter((item) =>
        item.servicos.some((id) => String(id) === String(form.servicoId))
    );
    const availability = useApi(
        form.data && form.barbeiroId && form.servicoId
            ? `/horarios-disponiveis?barbeiro=${form.barbeiroId}&servico=${form.servicoId}&data=${form.data}`
            : null
    );
    function update(values) {
        setForm((form) => ({ ...form, ...values }));
        setError('');
    }
    async function confirm() {
        setBusy(true);
        try {
            await api('/agendamentos', { method: 'POST', body: JSON.stringify(form) });
            setComplete(true);
        } catch (error) {
            setError(error.message);
            setStep(4);
            availability.reload();
        } finally {
            setBusy(false);
        }
    }
    if (complete)
        return (
            <div className="client-narrow success-screen">
                <div className="success-check">
                    <FiCheck />
                </div>
                <h1>Agendamento realizado!</h1>
                <p>
                    Seu horário está reservado.
                    <br />
                    Te esperamos!
                </p>
                <div className="panel">
                    <h3>{service?.ser_nome}</h3>
                    <p>
                        {dateLabel(form.data, { month: 'long' })} · {form.hora}
                    </p>
                    <strong>{barber?.usu_nome}</strong>
                </div>
                <Link className="btn-red full-width" href="/cliente/agenda">
                    Ver meus agendamentos <FiArrowRight />
                </Link>
            </div>
        );
    return (
        <div className="client-narrow">
            <PageHeader title="Seu próximo estilo" subtitle="Poucos passos. Um horário só seu." />
            <div className="booking-progress">
                {stepNames.map((name, index) => (
                    <div key={name} className={step >= index + 1 ? 'active' : ''}>
                        <span>{step > index + 1 ? <FiCheck /> : index + 1}</span>
                        <small>{name}</small>
                    </div>
                ))}
            </div>
            <Notice>{error || services.error || barbers.error || availability.error}</Notice>
            <h2 className="step-title">
                {
                    [
                        'Escolha seu serviço',
                        'Escolha o barbeiro',
                        'Escolha a data',
                        'Escolha o horário',
                        'Confirme seu agendamento',
                    ][step - 1]
                }
            </h2>
            {services.loading || barbers.loading ? (
                <Loading />
            ) : (
                <>
                    {step === 1 && (
                        <ServiceList
                            services={services.data || []}
                            selected={form.servicoId}
                            onSelect={(service) => {
                                update({ servicoId: service.ser_id, barbeiroId: '', hora: '' });
                                setStep(2);
                            }}
                        />
                    )}
                    {step === 2 &&
                        (eligible.length ? (
                            <BarberList
                                barbers={eligible}
                                selected={form.barbeiroId}
                                onSelect={(barber) => {
                                    update({ barbeiroId: barber.bar_id, hora: '' });
                                    setStep(3);
                                }}
                            />
                        ) : (
                            <Empty>Nenhum profissional disponível para esse serviço.</Empty>
                        ))}
                    {step === 3 && (
                        <>
                            <Calendar
                                value={form.data}
                                onChange={(data) => update({ data, hora: '' })}
                            />
                            <button
                                className="btn-red full-width"
                                disabled={!form.data}
                                onClick={() => setStep(4)}
                            >
                                Ver horários <FiArrowRight />
                            </button>
                        </>
                    )}
                    {step === 4 && (
                        <>
                            <p className="muted">
                                {dateLabel(form.data, { weekday: 'long', month: 'long' })} ·{' '}
                                {barber?.usu_nome}
                            </p>
                            {availability.loading ? (
                                <Loading />
                            ) : availability.data?.length ? (
                                <div className="slot-grid">
                                    {availability.data.map((hora) => (
                                        <button
                                            key={hora}
                                            className={form.hora === hora ? 'selected' : ''}
                                            onClick={() => update({ hora })}
                                        >
                                            {hora}
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <Empty>
                                    Não há horários nessa data. Volte e escolha outro dia.
                                </Empty>
                            )}
                            <button
                                className="btn-red full-width"
                                disabled={!form.hora}
                                onClick={() => setStep(5)}
                            >
                                Continuar <FiArrowRight />
                            </button>
                        </>
                    )}
                    {step === 5 && (
                        <>
                            <div className="panel confirmation-list">
                                {[
                                    [FiScissors, 'Serviço', service?.ser_nome],
                                    [FiUser, 'Barbeiro', barber?.usu_nome],
                                    [FiCalendar, 'Data', dateLabel(form.data, { month: 'long' })],
                                    [FiClock, 'Horário', form.hora],
                                    [FiCreditCard, 'Pagamento no local', money(service?.ser_valor)],
                                ].map(([Icon, label, value]) => (
                                    <div key={label}>
                                        <Icon />
                                        <span>
                                            <small>{label}</small>
                                            <strong>{value}</strong>
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <label className="field-label">
                                Alguma observação?{' '}
                                <textarea
                                    value={form.observacao}
                                    onChange={(e) => update({ observacao: e.target.value })}
                                    placeholder="Opcional"
                                />
                            </label>
                            <button
                                className="btn-red full-width"
                                disabled={busy}
                                onClick={confirm}
                            >
                                {busy ? 'Confirmando...' : 'Confirmar agendamento'}
                            </button>
                        </>
                    )}
                    {step > 1 && (
                        <button className="back-button" onClick={() => setStep(step - 1)}>
                            <FiArrowLeft /> Voltar
                        </button>
                    )}
                </>
            )}
        </div>
    );
}
