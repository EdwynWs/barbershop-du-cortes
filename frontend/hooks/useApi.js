'use client';
import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api';

export default function useApi(path) {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(Boolean(path));
    const [error, setError] = useState('');
    const reload = useCallback(async () => {
        if (!path) return;
        setLoading(true);
        setError('');
        try {
            setData(await api(path));
        } catch (error) {
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, [path]);
    useEffect(() => {
        if (!path) {
            setData(null);
            return;
        }
        let active = true;
        setLoading(true);
        setError('');
        api(path)
            .then((value) => {
                if (active) setData(value);
            })
            .catch((error) => {
                if (active) setError(error.message);
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [path]);
    return { data, loading, error, reload, setData };
}
