'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { FiLock, FiEye, FiEyeOff } from 'react-icons/fi';
import AuthLayout from '../../components/layout/AuthLayout';
import { Notice } from '../../components/ui/Feedback';
import { api } from '../../services/api';

export default function RedefinirSenhaPage() {
    const [token, setToken] = useState('');
    const [pronto, setPronto] = useState(false);
    const [senha, setSenha] = useState('');
    const [confirmacao, setConfirmacao] = useState('');
    const [visivel, setVisivel] = useState(false);
    const [ocupado, setOcupado] = useState(false);
    const [concluido, setConcluido] = useState(false);
    const [erro, setErro] = useState('');

    useEffect(() => {
        const fragmento = new URLSearchParams(window.location.hash.slice(1));
        const recebido = fragmento.get('token') || '';
        setToken(/^[a-f0-9]{64}$/.test(recebido) ? recebido : '');
        setPronto(true);
    }, []);

    async function salvar(event) {
        event.preventDefault();
        setErro('');
        if (senha !== confirmacao) {
            setErro('As senhas precisam ser iguais.');
            return;
        }
        if (new TextEncoder().encode(senha).length > 72) {
            setErro('A senha ficou muito longa. Use no máximo 72 bytes (acentos e emojis ocupam mais espaço).');
            return;
        }
        setOcupado(true);
        try {
            await api('/auth/redefinir-senha', {
                method: 'POST',
                body: JSON.stringify({ token, senha }),
            });
            setConcluido(true);
            setToken('');
            setSenha('');
            setConfirmacao('');
            window.history.replaceState(window.history.state, '', window.location.pathname);
        } catch (error) {
            setErro(error.message);
        } finally {
            setOcupado(false);
        }
    }

    return (
        <AuthLayout>
            <div className="auth-intro">
                <h1>{concluido ? 'Senha alterada!' : 'Crie sua nova senha'}</h1>
                <p>{concluido
                    ? 'Entre novamente com sua nova senha.'
                    : 'Escolha uma senha com pelo menos 8 caracteres.'}</p>
            </div>
            <Notice>{erro}</Notice>
            {!pronto ? <p role="status">Carregando...</p> : concluido ? (
                <Link href="/login" className="btn-red full-width">Ir para o login</Link>
            ) : !token ? (
                <Notice>Link inválido ou incompleto. Solicite um novo link abaixo.</Notice>
            ) : (
                <form onSubmit={salvar}>
                    <label className="input-icon">
                        <FiLock />
                        <input
                            type={visivel ? 'text' : 'password'}
                            aria-label="Nova senha"
                            placeholder="Nova senha"
                            autoComplete="new-password"
                            minLength={8}
                            maxLength={72}
                            required
                            value={senha}
                            onChange={(event) => setSenha(event.target.value)}
                        />
                        <button type="button" className="icon-button"
                            aria-label={visivel ? 'Ocultar senhas' : 'Mostrar senhas'}
                            onClick={() => setVisivel(!visivel)}>
                            {visivel ? <FiEyeOff /> : <FiEye />}
                        </button>
                    </label>
                    <label className="input-icon">
                        <FiLock />
                        <input
                            type={visivel ? 'text' : 'password'}
                            aria-label="Confirmar nova senha"
                            placeholder="Repita a nova senha"
                            autoComplete="new-password"
                            minLength={8}
                            maxLength={72}
                            required
                            value={confirmacao}
                            onChange={(event) => setConfirmacao(event.target.value)}
                        />
                    </label>
                    <button className="btn-red full-width auth-submit" disabled={ocupado}>
                        {ocupado ? 'Salvando...' : 'Salvar nova senha'}
                    </button>
                </form>
            )}
            {!concluido && (
                <p className="auth-switch"><Link href="/esqueci-senha">Solicitar outro link</Link></p>
            )}
        </AuthLayout>
    );
}
