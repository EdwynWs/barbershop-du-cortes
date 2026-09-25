'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiUser, FiMail, FiPhone, FiLock } from 'react-icons/fi';
import { api } from '../../services/api';
import AuthLayout from '../../components/layout/AuthLayout';
import { Notice } from '../../components/ui/Feedback';
export default function SignupPage() {
    const router = useRouter();
    const [form, setForm] = useState({ nome: '', email: '', telefone: '', senha: '' });
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    async function submit(event) {
        event.preventDefault();
        setBusy(true);
        try {
            const resultado = await api('/auth/cadastro', {
            method: 'POST',
            body: JSON.stringify(form),
        });

        const parametros = new URLSearchParams({
            email: form.email.trim().toLowerCase(),
            enviado: String(resultado.emailEnviado),
        });

        router.push(`/confirmar-email?${parametros.toString()}`);
        } catch (error) {
            setError(error.message);
        } finally {
            setBusy(false);
        }
    }
    const fields = [
        ['nome', 'Seu nome', 'text', FiUser],
        ['email', 'Seu email', 'email', FiMail],
        ['telefone', 'Telefone com DDD', 'tel', FiPhone],
        ['senha', 'Senha (mínimo 8 caracteres)', 'password', FiLock],
    ];
    return (
        <AuthLayout>
            <div className="auth-intro">
                <h1>Seu estilo começa aqui.</h1>
                <p>Crie sua conta e reserve seu horário.</p>
            </div>
            <Notice>{error}</Notice>
            <form onSubmit={submit}>
                {fields.map(([key, label, type, Icon]) => (
                    <label className="input-icon" key={key}>
                        <Icon />
                        <input
                            aria-label={label}
                            placeholder={label}
                            type={type}
                            required
                            minLength={key === 'senha' ? 8 : undefined}
                            value={form[key]}
                            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                        />
                    </label>
                ))}
                <button className="btn-red full-width auth-submit" disabled={busy}>
                    {busy ? 'Criando conta...' : 'Criar minha conta'}
                </button>
            </form>
            <p className="auth-switch">
                Já tem conta? <Link href="/login">Entrar</Link>
            </p>
            <p className="auth-switch">
                Não confirmou seu e-mail?{' '}
                <Link href="/confirmar-email">Reenviar confirmação</Link>
            </p>
        </AuthLayout>
    );
}
