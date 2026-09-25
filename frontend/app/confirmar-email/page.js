'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import AuthLayout from '../../components/layout/AuthLayout';

export default function ConfirmarEmailPage() {
    const [token, setToken] = useState('');
    const [email, setEmail] = useState('');
    const [mensagem, setMensagem] = useState('');
    const [erro, setErro] = useState('');
    const [ocupado, setOcupado] = useState(false);
    const [confirmado, setConfirmado] = useState(false);

    useEffect(() => {
        const endereco = new URL(window.location.href);
        const fragmento = new URLSearchParams(endereco.hash.slice(1));

        setToken(fragmento.get('token') || '');
        setEmail(endereco.searchParams.get('email') || '');

        if (endereco.searchParams.get('enviado') === 'true') {
            setMensagem(
                'Enviamos um link para seu e-mail. Ele vale por 30 minutos. Confira também o spam.'
            );
        }

        if (endereco.searchParams.get('enviado') === 'false') {
            setMensagem(
                'Sua conta foi criada, mas o envio falhou. Aguarde um minuto e solicite outro link abaixo.'
            );
        }
    }, []);

    async function confirmar() {
        setOcupado(true);
        setErro('');
        setMensagem('');

        try {
            const resultado = await api('/auth/confirmar-email', {
                method: 'POST',
                body: JSON.stringify({ token }),
            });

            setConfirmado(true);
            setToken('');
            setMensagem(resultado.mensagem);

            window.history.replaceState(
                window.history.state,
                '',
                window.location.pathname
            );
        } catch (error) {
            setErro(error.message);
        } finally {
            setOcupado(false);
        }
    }

    async function reenviar(event) {
        event.preventDefault();

        setOcupado(true);
        setErro('');
        setMensagem('');

        try {
            const resultado = await api('/auth/reenviar-confirmacao', {
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
                <h1>
                    {confirmado ? 'E-mail confirmado!' : 'Confirme seu e-mail'}
                </h1>

                <p>
                    {confirmado
                        ? 'Sua conta está pronta para acessar o sistema.'
                        : token
                          ? 'Clique no botão abaixo para concluir a confirmação.'
                          : 'Abra o link enviado para seu e-mail para liberar o acesso.'}
                </p>
            </div>

            {mensagem && (
                <div className="alert alert-info" role="status">
                    {mensagem}
                </div>
            )}

            {erro && (
                <div className="alert alert-danger" role="alert">
                    {erro}
                </div>
            )}

            {confirmado ? (
                <Link className="btn-red full-width" href="/login">
                    Entrar na minha conta
                </Link>
            ) : (
                <>
                    {token && (
                        <button
                            type="button"
                            className="btn-red full-width"
                            onClick={confirmar}
                            disabled={ocupado}
                        >
                            {ocupado ? 'Aguarde...' : 'Confirmar meu e-mail'}
                        </button>
                    )}

                    <div className="auth-divider" />

                    <form onSubmit={reenviar}>
                        <label htmlFor="email-confirmacao" className="mb-2">
                            Não recebeu ou o link expirou?
                        </label>

                        <input
                            id="email-confirmacao"
                            type="email"
                            className="form-control mb-3"
                            placeholder="Seu e-mail cadastrado"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                        />

                        <button
                            type="submit"
                            className="btn-outline full-width"
                            disabled={ocupado}
                        >
                            {ocupado ? 'Aguarde...' : 'Reenviar confirmação'}
                        </button>
                    </form>

                    <p className="auth-switch">
                        Já confirmou? <Link href="/login">Entrar</Link>
                    </p>
                </>
            )}
        </AuthLayout>
    );
}