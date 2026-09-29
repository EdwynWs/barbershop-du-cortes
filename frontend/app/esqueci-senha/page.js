'use client';

import Link from 'next/link';
import { useState } from 'react';
import { FiMail } from 'react-icons/fi';
import AuthLayout from '../../components/layout/AuthLayout';
import { Notice } from '../../components/ui/Feedback';
import { api } from '../../services/api';

export default function EsqueciSenhaPage() {
    const [email, setEmail] = useState('');
    const [mensagem, setMensagem] = useState('');
    const [erro, setErro] = useState('');
    const [ocupado, setOcupado] = useState(false);

    async function enviar(event) {
        event.preventDefault();
        setOcupado(true);
        setErro('');
        setMensagem('');
        try {
            const resultado = await api('/auth/esqueci-senha', {
                method: 'POST',
                body: JSON.stringify({ email }),
            });
            setMensagem(resultado.mensagem);
        } catch (error) {
            setErro(error.message);
        } finally {
            setOcupado(false);
        }
    }

    return (
        <AuthLayout>
            <div className="auth-intro">
                <h1>Esqueceu sua senha?</h1>
                <p>Informe o e-mail da sua conta para receber um link de recuperação.</p>
            </div>
            <Notice>{erro}</Notice>
            <Notice success>{mensagem}</Notice>
            <form onSubmit={enviar}>
                <label className="input-icon">
                    <FiMail />
                    <input
                        type="email"
                        aria-label="E-mail cadastrado"
                        placeholder="Seu e-mail cadastrado"
                        autoComplete="email"
                        maxLength={255}
                        required
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                    />
                </label>
                <button className="btn-red full-width auth-submit" disabled={ocupado}>
                    {ocupado ? 'Aguarde...' : 'Enviar link de recuperação'}
                </button>
            </form>
            <p className="auth-switch"><Link href="/login">Voltar para o login</Link></p>
        </AuthLayout>
    );
}
