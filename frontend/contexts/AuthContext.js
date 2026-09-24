'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../services/api';
const Context = createContext(null);
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null),
        [loading, setLoading] = useState(true),
        router = useRouter();
    useEffect(() => {
        api('/auth/me')
            .then(setUser)
            .catch(() => setUser(null))
            .finally(() => setLoading(false));
    }, []);
    async function login(email, senha) {
        const u = await api('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, senha }),
        });
        setUser(u);
        router.push(
            u.tipo === 'ADMIN'
                ? '/admin/dashboard'
                : u.tipo === 'BARBEIRO'
                  ? '/barbeiro/agenda'
                  : '/cliente/home'
        );
    }
    async function logout() {
        await api('/auth/logout', { method: 'POST' });
        setUser(null);
        router.push('/login');
    }
    return (
        <Context.Provider value={{ user, loading, login, logout, setUser }}>
            {children}
        </Context.Provider>
    );
}
export const useAuth = () => useContext(Context);
