'use client';
import { useState } from 'react';
import useApi from '../../hooks/useApi';
import { api, today, money } from '../../services/api';
import { Notice } from '../ui/Feedback';
export default function BookingForm({ onSaved, clientId = '' }) {
    const clients = useApi('/admin/clientes');
    const services = useApi('/servicos');
    const barbers = useApi('/barbeiros');
    const [form, setForm] = useState({
        clienteId: clientId,
        servicoId: '',
        barbeiroId: '',
        data: today(),
        hora: '',
    });
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const slots = useApi(
        form.servicoId && form.barbeiroId
            ? `/horarios-disponiveis?barbeiro=${form.barbeiroId}&servico=${form.servicoId}&data=${form.data}`
            : null
    );
    function update(values) {
        setForm((form) => ({ ...form, ...values }));
    }
    async function save(event) {
        event.preventDefault();
        setBusy(true);
        try {
            await api('/agendamentos', { method: 'POST', body: JSON.stringify(form) });
            onSaved();
        } catch (error) {
            setError(error.message);
            slots.reload();
        } finally {
            setBusy(false);
        }
    }
    return (
        <form onSubmit={save}>
            <Notice>
                {error || clients.error || services.error || barbers.error || slots.error}
            </Notice>
            <label className="field-label">
                Cliente
                <select
                    required
                    value={form.clienteId}
                    onChange={(e) => update({ clienteId: e.target.value })}
                >
                    <option value="">Selecione o cliente</option>
                    {clients.data?.map((item) => (
                        <option key={item.cli_id} value={item.cli_id}>
                            {item.usu_nome}
                        </option>
                    ))}
                </select>
            </label>
            <label className="field-label">
                Serviço
                <select
                    required
                    value={form.servicoId}
                    onChange={(e) =>
                        update({ servicoId: e.target.value, barbeiroId: '', hora: '' })
                    }
                >
                    <option value="">Selecione o serviço</option>
                    {services.data?.map((item) => (
                        <option key={item.ser_id} value={item.ser_id}>
                            {item.ser_nome} · {money(item.ser_valor)}
                        </option>
                    ))}
                </select>
            </label>
            <label className="field-label">
                Barbeiro
                <select
                    required
                    value={form.barbeiroId}
                    onChange={(e) => update({ barbeiroId: e.target.value, hora: '' })}
                >
                    <option value="">Selecione o barbeiro</option>
                    {barbers.data
                        ?.filter((item) =>
                            item.servicos.some((id) => String(id) === form.servicoId)
                        )
                        .map((item) => (
                            <option key={item.bar_id} value={item.bar_id}>
                                {item.usu_nome}
                            </option>
                        ))}
                </select>
            </label>
            <div className="form-columns">
                <label className="field-label">
                    Data
                    <input
                        required
                        type="date"
                        min={today()}
                        value={form.data}
                        onChange={(e) => update({ data: e.target.value, hora: '' })}
                    />
                </label>
                <label className="field-label">
                    Horário
                    <select
                        required
                        value={form.hora}
                        onChange={(e) => update({ hora: e.target.value })}
                    >
                        <option value="">{slots.loading ? 'Carregando...' : 'Selecione'}</option>
                        {slots.data?.map((item) => (
                            <option key={item}>{item}</option>
                        ))}
                    </select>
                </label>
            </div>
            <button className="btn-red full-width" disabled={busy}>
                Confirmar agendamento
            </button>
        </form>
    );
}
