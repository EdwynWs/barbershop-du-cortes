'use client';
import Link from 'next/link';
import { useState } from 'react';
import { FiChevronRight, FiUser, FiClock } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import { Notice } from '../../components/ui/Feedback';
export default function SettingsPage() {
    const { user, setUser } = useAuth();
    const [form, setForm] = useState({ nome: user?.nome || '', telefone: user?.telefone || '' });
    const [message, setMessage] = useState('');
    async function save(event) {
        event.preventDefault();
        try {
            const updated = await api('/auth/perfil', {
                method: 'PUT',
                body: JSON.stringify(form),
            });
            setUser({ ...user, nome: updated.usu_nome, telefone: updated.usu_telefone });
            setMessage('Seus dados foram atualizados.');
        } catch (error) {
            setMessage(error.message);
        }
    }
    return (
        <div className="settings-page">
            <PageHeader title="Configurações" subtitle="Seus dados e as opções da equipe." />
            <Notice>{message}</Notice>
            <section className="panel">
                <h2>Dados do administrador</h2>
                <form onSubmit={save}>
                    <label className="field-label">
                        Nome
                        <input
                            required
                            value={form.nome}
                            onChange={(e) => setForm({ ...form, nome: e.target.value })}
                        />
                    </label>
                    <label className="field-label">
                        Telefone
                        <input
                            value={form.telefone}
                            onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                        />
                    </label>
                    <label className="field-label">
                        Email
                        <input value={user?.email || ''} readOnly />
                    </label>
                    <button className="btn-red">Salvar alterações</button>
                </form>
            </section>
            <section className="panel">
                <h2>Funcionamento</h2>
                <Link className="settings-link" href="/admin/barbeiros">
                    <FiClock />
                    <span>
                        Horários e serviços da equipe
                        <small>Configure os dias e intervalos de cada barbeiro.</small>
                    </span>
                    <FiChevronRight />
                </Link>
                <p className="muted small">
                    Os clientes podem cancelar até duas horas antes do horário agendado.
                </p>
            </section>
        </div>
    );
}
