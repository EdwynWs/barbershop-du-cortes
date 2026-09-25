'use client';
import Link from 'next/link';
import {
    FiCalendar,
    FiUsers,
    FiTag,
    FiArrowUpRight,
    FiScissors,
    FiDollarSign,
} from 'react-icons/fi';
import useApi from '../../hooks/useApi';
import { useAuth } from '../../contexts/AuthContext';
import { dateLabel, money, today } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import { Notice, Loading } from '../../components/ui/Feedback';
import MetricCard from '../../components/admin/MetricCard';
import RevenueChart from '../../components/admin/RevenueChart';

export default function DashboardPage() {
    const { user } = useAuth();
    const { data, loading, error } = useApi('/admin/dashboard', { refreshInterval: 15000 });
    return (
        <>
            <PageHeader
                title={`Olá, ${user?.nome.split(' ')[0]}`}
                subtitle="Acompanhe o movimento da sua barbearia."
                action={
                    <span className="date-label">
                        <FiCalendar /> {dateLabel(today(), { year: 'numeric', month: 'long' })}
                    </span>
                }
            />
            <Notice>{error}</Notice>
            {loading ? (
                <Loading />
            ) : (
                data && (
                    <>
                        <div className="metrics-revenue">
                            <MetricCard
                                label="Receita hoje"
                                value={money(data.faturamentoHoje)}
                                accent
                                caption="Pagamentos recebidos hoje"
                            />
                            <MetricCard
                                label="Receita do mês"
                                value={money(data.faturamentoMes)}
                                caption="Recebimentos do mês até hoje"
                            />
                            <MetricCard
                                label="Receita total"
                                value={money(data.faturamentoTotal)}
                                caption="Todo o histórico da barbearia"
                            />
                        </div>
                        <div className="metrics-small">
                            <MetricCard
                                label="Atendimentos hoje"
                                value={data.atendimentosHoje}
                                icon={FiCalendar}
                            />
                            <MetricCard
                                label="Atendimentos no mês"
                                value={data.atendimentosMes}
                                icon={FiScissors}
                            />
                            <MetricCard
                                label="Novos clientes"
                                value={data.novosClientes}
                                icon={FiUsers}
                            />
                            <MetricCard
                                label="Ticket médio do mês"
                                value={money(data.ticketMedio)}
                                icon={FiTag}
                            />
                            <MetricCard
                                label="A receber"
                                value={money(data.saldoPendente)}
                                icon={FiDollarSign}
                            />
                        </div>
                        <div className="dashboard-main-grid">
                            <section className="panel chart-panel">
                                <div className="section-heading">
                                    <h2>
                                        Recebimentos <small>(últimos 7 dias)</small>
                                    </h2>
                                    <Link href="/admin/relatorios" aria-label="Ver relatórios">
                                        <FiArrowUpRight />
                                    </Link>
                                </div>
                                <RevenueChart data={data.ultimosDias} />
                            </section>
                            <section className="panel highlights">
                                <h2>Destaques da barbearia</h2>
                                <Link href="/admin/relatorios" className="highlight-row">
                                    <span className="highlight-icon">
                                        <FiCalendar />
                                    </span>
                                    <div>
                                        <small>Maior receita diária do mês</small>
                                        <strong>
                                            {data.melhorDia
                                                ? dateLabel(data.melhorDia.dia, { weekday: 'long' })
                                                : 'Sem dados ainda'}
                                        </strong>
                                        <b>{money(data.melhorDia?.faturamento)}</b>
                                        <small>
                                            {data.melhorDia?.atendimentos || 0} atendimentos
                                        </small>
                                    </div>
                                    <FiArrowUpRight />
                                </Link>
                                <Link href="/admin/servicos" className="highlight-row">
                                    <span className="highlight-icon">
                                        <FiScissors />
                                    </span>
                                    <div>
                                        <small>Serviço mais realizado no mês</small>
                                        <strong>
                                            {data.carroChefe?.ser_nome || 'Sem dados ainda'}
                                        </strong>
                                        <small>
                                            {data.carroChefe?.quantidade || 0} atendimentos ·{' '}
                                            {money(data.carroChefe?.faturamento)}
                                        </small>
                                    </div>
                                    <FiArrowUpRight />
                                </Link>
                                <Link href="/admin/financeiro" className="highlight-row">
                                    <span className="highlight-icon gold">
                                        <FiDollarSign />
                                    </span>
                                    <div>
                                        <small>Resultado do mês</small>
                                        <strong>Receitas menos despesas</strong>
                                        <small>{money(data.lucroMes)}</small>
                                    </div>
                                    <FiArrowUpRight />
                                </Link>
                            </section>
                        </div>
                        <section className="panel chart-panel">
                            <div className="section-heading">
                                <h2>Receita mensal</h2>
                                <span className="chart-legend">
                                    <i /> Últimos 12 meses
                                </span>
                            </div>
                            <RevenueChart data={data.mensal} x="mes" bars />
                        </section>
                    </>
                )
            )}
        </>
    );
}
