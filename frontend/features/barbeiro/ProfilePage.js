'use client';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import { Notice } from '../../components/ui/Feedback';
export default function BarberProfilePage() {
    const { user, setUser, logout } = useAuth();
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
            setMessage('Perfil atualizado.');
        } catch (error) {
            setMessage(error.message);
        }
    }
    return (
        <div className="client-narrow">
            <PageHeader title="Meu perfil" />
            <Notice>{message}</Notice>
            <form className="panel" onSubmit={save}>
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
                    <input readOnly value={user?.email || ''} />
                </label>
                <button className="btn-red full-width">Salvar perfil</button>
            </form>
            <button className="back-button" onClick={logout}>
                Sair da conta
            </button>
        </div>
    );
}
