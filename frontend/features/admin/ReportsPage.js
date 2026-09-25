'use client';
import { useState } from 'react';
import useApi from '../../hooks/useApi';
import { today, money, dateLabel } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import { Notice, Loading, Empty } from '../../components/ui/Feedback';
import PeriodFilter from '../../components/admin/PeriodFilter';
import RevenueChart from '../../components/admin/RevenueChart';
import MetricCard from '../../components/admin/MetricCard';
const labels = {
    periodo: 'Data',
    atendimentos: 'Atendimentos',
    faturamento: 'Faturamento',
    ser_nome: 'Serviço',
    usu_nome: 'Nome',
    avaliacao: 'Avaliação',
    total_gasto: 'Total recebido',
    valor_servicos: 'Valor dos serviços concluídos',
    dia_semana: 'Dia da semana',
    hora: 'Horário',
};
const weekdays = ['', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
export default function ReportsPage() {
    const [period, setPeriod] = useState({ inicio: today().slice(0, 7) + '-01', fim: today() });
    const [type, setType] = useState('faturamento');
    const report = useApi(`/admin/relatorios/${type}?inicio=${period.inicio}&fim=${period.fim}`, {
        refreshInterval: 15000,
    });
    const rows = report.data || [];
    const total = rows.reduce(
        (sum, item) => sum + Number(item.faturamento ?? item.total_gasto ?? 0),
        0
    );
    const serviceValue = rows.reduce((sum, item) => sum + Number(item.valor_servicos || 0), 0);
    const count = rows.reduce((sum, item) => sum + Number(item.atendimentos || 0), 0);
    const columns = rows[0] ? Object.keys(rows[0]) : [];
    function format(key, value) {
        if (['faturamento', 'total_gasto', 'valor_servicos'].includes(key)) return money(value);
        if (key === 'periodo') return dateLabel(value);
        if (key === 'dia_semana') return weekdays[value];
        if (key === 'hora') return `${value}h–${Number(value) + 1}h`;
        return value ?? '—';
    }
    const maximum = Math.max(
        1,
        ...rows.map((item) =>
            Number(item.faturamento ?? item.total_gasto ?? item.atendimentos ?? 0)
        )
    );
    return (
        <>
            <PageHeader
                title="Relatórios"
                subtitle="Receita pela data do pagamento. Atendimentos e ticket pela data do serviço."
            />
            <PeriodFilter value={period} onChange={setPeriod} />
            <div className="tabs">
                {[
                    ['faturamento', 'Faturamento'],
                    ['servicos', 'Serviços'],

                    ['clientes', 'Clientes'],
                    ['horarios', 'Horários'],
                ].map(([value, label]) => (
                    <button
                        key={value}
                        className={type === value ? 'active red' : ''}
                        onClick={() => setType(value)}
                    >
                        {label}
                    </button>
                ))}
            </div>
            <Notice>{report.error}</Notice>
            {report.loading ? (
                <Loading />
            ) : (
                <>
                    <div className="metrics-revenue">
                        {type !== 'horarios' && (
                            <MetricCard
                                label="Receita recebida no período"
                                value={money(total)}
                                accent
                            />
                        )}
                        <MetricCard label="Atendimentos concluídos" value={count} />
                        {type !== 'horarios' && (
                            <MetricCard
                                label="Ticket médio"
                                value={money(count ? serviceValue / count : 0)}
                            />
                        )}
                    </div>
                    {!rows.length ? (
                        <Empty>Nenhum dado para o período escolhido.</Empty>
                    ) : (
                        <>
                            <div className="panel">
                                <h2>
                                    {type === 'faturamento'
                                        ? 'Recebimentos por dia'
                                        : 'Ranking do período'}
                                </h2>
                                {type === 'faturamento' ? (
                                    <RevenueChart data={rows} x="periodo" y="faturamento" bars />
                                ) : (
                                    <div className="ranking-list">
                                        {rows.slice(0, 8).map((item, index) => (
                                            <div className="ranking-row" key={index}>
                                                <div>
                                                    <strong>
                                                        {item.ser_nome ||
                                                            item.usu_nome ||
                                                            `${weekdays[item.dia_semana]} · ${item.hora}h`}
                                                    </strong>
                                                    <span>
                                                        {item.faturamento !== undefined ||
                                                        item.total_gasto !== undefined
                                                            ? money(
                                                                  item.faturamento ??
                                                                      item.total_gasto
                                                              )
                                                            : `${item.atendimentos} atendimentos`}
                                                    </span>
                                                </div>
                                                <span className="ranking-track">
                                                    <i
                                                        style={{
                                                            width: `${(Number(item.faturamento ?? item.total_gasto ?? item.atendimentos ?? 0) / maximum) * 100}%`,
                                                        }}
                                                    />
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="table-wrap">
                                <table>
                                    <thead>
                                        <tr>
                                            {columns.map((key) => (
                                                <th key={key}>{labels[key] || key}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.map((item, index) => (
                                            <tr key={index}>
                                                {columns.map((key) => (
                                                    <td key={key}>{format(key, item[key])}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </>
            )}
        </>
    );
}
