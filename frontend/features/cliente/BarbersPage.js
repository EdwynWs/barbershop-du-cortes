'use client';
import { useRouter } from 'next/navigation';
import PageHeader from '../../components/ui/PageHeader';
import BarberList from '../../components/cliente/BarberList';
import { Notice, Loading } from '../../components/ui/Feedback';
import useApi from '../../hooks/useApi';
export default function BarbersPage() {
    const router = useRouter();
    const { data, loading, error } = useApi('/barbeiros');
    return (
        <div className="client-narrow">
            <PageHeader
                title="Nossos barbeiros"
                subtitle="Escolha quem vai cuidar do seu estilo."
            />
            <Notice>{error}</Notice>
            {loading ? (
                <Loading />
            ) : (
                <BarberList
                    barbers={data || []}
                    onSelect={(barber) => router.push(`/cliente/agendar?barbeiro=${barber.bar_id}`)}
                />
            )}
        </div>
    );
}
