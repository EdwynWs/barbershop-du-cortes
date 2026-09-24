'use client';
import { useState } from 'react';
import Link from 'next/link';
import {
    FiCalendar,
    FiClock,
    FiScissors,
    FiBell,
    FiHelpCircle,
    FiChevronRight,
    FiLogOut,
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import Photo from '../../components/ui/Photo';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import { Notice } from '../../components/ui/Feedback';
export default function ProfilePage() {
    const { user, setUser, logout } = useAuth();
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({ nome: '', telefone: '' });
    const [message, setMessage] = useState('');
    const [busy, setBusy] = useState(false);
    async function save(event) {
        event.preventDefault();
        setBusy(true);
        try {
            const updated = await api('/auth/perfil', {
                method: 'PUT',
                body: JSON.stringify(form),
            });
            setUser({ ...user, nome: updated.usu_nome, telefone: updated.usu_telefone });
            setEditing(false);
            setMessage('Perfil atualizado.');
        } catch (error) {
            setMessage(error.message);
        } finally {
            setBusy(false);
        }
    }
    return (
        <div className="client-narrow">
            <PageHeader title="Meu perfil" />
            <Notice>{message}</Notice>
            <div className="profile-heading">
                <Photo alt={user?.nome} person />
                <h2>{user?.nome}</h2>
                <p>
                    {user?.telefone}
                    <br />
                    {user?.email}
                </p>
                <button
                    className="btn-outline"
                    onClick={() => {
                        setForm({ nome: user.nome, telefone: user.telefone || '' });
                        setEditing(true);
                    }}
                >
                    Editar perfil
                </button>
            </div>
            <div className="profile-links">
                {[
                    [FiCalendar, 'Meus agendamentos', '/cliente/agenda'],
                    [FiScissors, 'Nossos serviços', '/cliente/servicos'],
                    [FiBell, 'Notificações', '/cliente/notificacoes'],
                ].map(([Icon, label, href]) => (
                    <Link key={href} href={href}>
                        <Icon />
                        <span>{label}</span>
                        <FiChevronRight />
                    </Link>
                ))}
                <details>
                    <summary>
                        <FiHelpCircle /> Ajuda
                    </summary>
                    <p>
                        Agende pelo aplicativo e pague no local. Para cancelar, entre em Meus
                        agendamentos até duas horas antes do atendimento.
                    </p>
                </details>
            </div>
            <button className="btn-red full-width" onClick={logout}>
                <FiLogOut /> Sair
            </button>
            {editing && (
                <Modal title="Editar perfil" onClose={() => setEditing(false)}>
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
                        <button className="btn-red full-width" disabled={busy}>
                            Salvar alterações
                        </button>
                    </form>
                </Modal>
            )}
        </div>
    );
}
