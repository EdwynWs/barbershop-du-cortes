'use client';
import { useState } from 'react';
import PageHeader from '../../components/ui/PageHeader';
import ServiceList from '../../components/cliente/ServiceList';
import { Notice, Loading, Empty } from '../../components/ui/Feedback';
import useApi from '../../hooks/useApi';
export default function ServicesPage() {
    const { data, loading, error } = useApi('/servicos');
    const [filter, setFilter] = useState('Todos');
    const items = (data || []).filter(
        (item) =>
            filter === 'Todos' ||
            (filter === 'Combos'
                ? item.ser_nome.includes('+')
                : filter === 'Cabelo'
                  ? /corte|capilar|pigment/i.test(item.ser_nome)
                  : /barba/i.test(item.ser_nome))
    );
    return (
        <div className="client-narrow">
            <PageHeader title="Nossos serviços" subtitle="O cuidado que o seu estilo merece." />
            <div className="tabs">
                {['Todos', 'Cabelo', 'Barba', 'Combos'].map((item) => (
                    <button
                        key={item}
                        className={item === filter ? 'active' : ''}
                        onClick={() => setFilter(item)}
                    >
                        {item}
                    </button>
                ))}
            </div>
            <Notice>{error}</Notice>
            {loading ? (
                <Loading />
            ) : items.length ? (
                <ServiceList services={items} />
            ) : (
                <Empty>Nenhum serviço nessa categoria.</Empty>
            )}
        </div>
    );
}
