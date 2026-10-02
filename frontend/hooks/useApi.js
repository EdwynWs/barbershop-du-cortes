'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../services/api';

export default function useApi(path, { refreshInterval = 0 } = {}) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(Boolean(path));
    const [error, setError] = useState('');
    const sequence = useRef(0);
    const mounted = useRef(false);
    const fetching = useRef(false);

    const reload = useCallback(async ({ silent = false } = {}) => {
        if (!path || !mounted.current || (silent && fetching.current)) return;
        const request = ++sequence.current;
        fetching.current = true;
        if (!silent) setLoading(true);
        try {
            const result = await api(path);
            if (mounted.current && request === sequence.current) {
                setData(result);
                setError('');
            }
            return result;
        } catch (error) {
            if (mounted.current && request === sequence.current) setError(error.message);
        } finally {
            if (mounted.current && request === sequence.current) {
                fetching.current = false;
                setLoading(false);
            }
        }
    }, [path]);

    useEffect(() => {
        mounted.current = true;
        fetching.current = false;
        setData(null);
        setError('');
        if (path) void reload();
        else setLoading(false);
        const refresh = () => {
            if (document.visibilityState === 'visible') void reload({ silent: true });
        };
        const timer = path && refreshInterval > 0 ? setInterval(refresh, refreshInterval) : null;
        window.addEventListener('focus', refresh);
        document.addEventListener('visibilitychange', refresh);
        return () => {
            mounted.current = false;
            ++sequence.current;
            if (timer) clearInterval(timer);
            window.removeEventListener('focus', refresh);
            document.removeEventListener('visibilitychange', refresh);
        };
    }, [path, reload, refreshInterval]);

    return { data, loading, error, reload, setData };
}
