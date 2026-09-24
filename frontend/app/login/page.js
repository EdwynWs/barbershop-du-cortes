'use client';
import Link from 'next/link';
import { useState } from 'react';
import { FiMail, FiLock, FiEye, FiEyeOff, FiArrowRight } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import AuthLayout from '../../components/layout/AuthLayout';
import { Notice } from '../../components/ui/Feedback';
export default function LoginPage() {
    const { login } = useAuth();
    const [form, setForm] = useState({ email: '', senha: '' });
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [visible, setVisible] = useState(false);
    async function submit(event) {
        event.preventDefault();
        setBusy(true);
        setError('');
        try {
            await login(form.email, form.senha);
        } catch (error) {
            setError(error.message);
        } finally {
            setBusy(false);
        }
    }
    return (
        <AuthLayout>
            <div className="auth-intro">
                <h1>Bem-vindo!</h1>
                <p>
                    Faça seu login para agendar
                    <br />
                    seu horário.
                </p>
            </div>
            <Notice>{error}</Notice>
            <form onSubmit={submit}>
                <label className="input-icon">
                    <FiMail />
                    <input
                        type="email"
                        aria-label="Email"
                        placeholder="Seu email"
                        autoComplete="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                </label>
                <label className="input-icon">
                    <FiLock />
                    <input
                        type={visible ? 'text' : 'password'}
                        aria-label="Senha"
                        placeholder="Senha"
                        autoComplete="current-password"
                        required
                        value={form.senha}
                        onChange={(e) => setForm({ ...form, senha: e.target.value })}
                    />
                    <button
                        type="button"
                        className="icon-button"
                        aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
                        onClick={() => setVisible(!visible)}
                    >
                        {visible ? <FiEyeOff /> : <FiEye />}
                    </button>
                </label>
                <button className="btn-red full-width auth-submit" disabled={busy}>
                    {busy ? 'Entrando...' : 'Entrar'} <FiArrowRight />
                </button>
            </form>
            <div className="auth-divider">
                <span />
            </div>
            <p className="auth-switch">
                Ainda não tem conta? <Link href="/cadastro">Cadastre-se</Link>
            </p>
        </AuthLayout>
    );
}
