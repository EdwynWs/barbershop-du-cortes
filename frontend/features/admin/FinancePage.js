'use client';
import { useState } from 'react';
import { FiPlus, FiDollarSign, FiTrendingDown, FiTrendingUp } from 'react-icons/fi';
import useApi from '../../hooks/useApi';
import { api, today, dateLabel, money } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import { Notice, Loading, Empty, Status } from '../../components/ui/Feedback';
import RevenueChart from '../../components/admin/RevenueChart';
import MetricCard from '../../components/admin/MetricCard';
export default function FinancePage() {
    const finance = useApi('/admin/financeiro', { refreshInterval: 15000 });

    const [tab, setTab] = useState('Visão geral');
    const [modal, setModal] = useState('');
    const [form, setForm] = useState({});
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    async function save(event) {
        event.preventDefault();
        setBusy(true);
        setError('');
        try {
            await api(modal === 'Receita' ? '/admin/pagamentos' : '/admin/despesas', {
                method: 'POST',
                body: JSON.stringify(form),
            });
            setModal('');
            await finance.reload({ silent: true });
        } catch (error) {
            setError(error.message);
        } finally {
            setBusy(false);
        }
    }
    function open(type) {
        finance.reload({ silent: true });
        setModal(type);
        setError('');
        setForm(
            type === 'Receita'
                ? { ageId: '', valor: '', forma: 'PIX' }
                : { descricao: '', categoria: 'Produtos', valor: '', data: today() }
        );
    }
    const data = finance.data;
    return (
        <>
            <PageHeader
                title="Financeiro"
                subtitle="Recebimentos, despesas e seu resultado."
                action={
                    <button
                        className="btn-red"
                        onClick={() => open(tab === 'Despesas' ? 'Despesa' : 'Receita')}
                    >
                        <FiPlus /> {tab === 'Despesas' ? 'Nova despesa' : 'Receber pagamento'}
                    </button>
                }
            />
            <div className="tabs">
                {['Visão geral', 'Receitas', 'Despesas'].map((item) => (
                    <button
                        key={item}
                        className={item === tab ? 'active' : ''}
                        onClick={() => setTab(item)}
                    >
                        {item}
                    </button>
                ))}
            </div>
            <Notice>{!modal && (error || finance.error)}</Notice>
            {finance.loading ? (
                <Loading />
            ) : (
                data && (
                    <>
                        {tab === 'Visão geral' && (
                            <>
                                <div className="metrics-revenue">
                                    <MetricCard
                                        label="Receita hoje"
                                        value={money(data.resumo.faturamentoHoje)}
                                    />
                                    <MetricCard
                                        label="Receita do mês"
                                        value={money(data.resumo.faturamentoMes)}
                                        accent
                                    />
                                    <MetricCard
                                        label="Receita total"
                                        value={money(data.resumo.faturamentoTotal)}
                                    />
                                </div>
                                <div className="metrics-pair">
                                    <MetricCard
                                        label="Despesas do mês"
                                        value={money(data.resumo.despesasMes)}
                                        icon={FiTrendingDown}
                                    />
                                    <MetricCard
                                        label="Resultado do mês"
                                        value={money(data.resumo.lucroMes)}
                                        icon={FiTrendingUp}
                                        caption="Recebimentos menos despesas, do início do mês até hoje"
                                    />
                                </div>
                                <div className="panel chart-panel">
                                    <h2>Receita mensal</h2>
                                    <RevenueChart data={data.resumo.mensal} x="mes" bars />
                                </div>
                            </>
                        )}
                        {tab !== 'Despesas' && (
                            <section className="panel">
                                <div className="section-heading">
                                    <h2>
                                        {tab === 'Visão geral'
                                            ? 'Últimos recebimentos'
                                            : 'Recebimentos (últimos 200)'}
                                    </h2>
                                    <FiDollarSign />
                                </div>
                                {data.receitas.length ? (
                                    data.receitas
                                        .slice(0, tab === 'Visão geral' ? 6 : 200)
                                        .map((item) => (
                                            <div className="receipt-row" key={item.pag_id}>
                                                <div>
                                                    <strong>{item.cliente}</strong>
                                                    <small>
                                                        {item.ser_nome} · {item.barbeiro}
                                                    </small>
                                                    <small>
                                                        {dateLabel(item.pag_dia || item.pag_data)} ·{' '}
                                                        {item.pag_forma.replaceAll('_', ' ')}
                                                    </small>
                                                </div>
                                                <div>
                                                    <b>{money(item.pag_valor)}</b>
                                                    <Status value={item.pag_status} />
                                                </div>
                                            </div>
                                        ))
                                ) : (
                                    <Empty>Nenhum recebimento registrado.</Empty>
                                )}
                            </section>
                        )}
                        {tab === 'Despesas' && (
                            <section className="panel">
                                <h2>Despesas (últimas 200)</h2>
                                {data.despesas.length ? (
                                    data.despesas.map((item) => (
                                        <div className="receipt-row" key={item.des_id}>
                                            <div>
                                                <strong>{item.des_descricao}</strong>
                                                <small>
                                                    {item.des_categoria} ·{' '}
                                                    {dateLabel(item.des_data)}
                                                </small>
                                            </div>
                                            <b>{money(item.des_valor)}</b>
                                        </div>
                                    ))
                                ) : (
                                    <Empty>Nenhuma despesa registrada.</Empty>
                                )}
                            </section>
                        )}
                    </>
                )
            )}
            {modal && (
                <Modal
                    title={modal === 'Receita' ? 'Registrar recebimento' : 'Cadastrar despesa'}
                    onClose={() => setModal('')}
                >
                    <Notice>{error || finance.error}</Notice>
                    {modal === 'Receita' && !finance.data?.pendencias?.length && (
                        <p>Nenhum atendimento concluído com saldo pendente.</p>
                    )}
                    <form onSubmit={save}>
                        {modal === 'Receita' ? (
                            <>
                                <label className="field-label">
                                    Atendimento com saldo pendente
                                    <select
                                        required
                                        value={form.ageId}
                                        onChange={(e) => {
                                            const item = finance.data?.pendencias?.find(
                                                (item) => String(item.age_id) === e.target.value
                                            );
                                            setForm({
                                                ...form,
                                                ageId: e.target.value,
                                                valor: item?.saldo || '',
                                            });
                                        }}
                                    >
                                        <option value="">Selecione</option>
                                        {finance.data?.pendencias?.map((item) => (
                                            <option key={item.age_id} value={item.age_id}>
                                                {item.cliente} · {item.ser_nome} ·{' '}
                                                {dateLabel(item.age_data)} · Saldo:{' '}
                                                {money(item.saldo)}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                                <label className="field-label">
                                    Forma de pagamento
                                    <select
                                        value={form.forma}
                                        onChange={(e) =>
                                            setForm({ ...form, forma: e.target.value })
                                        }
                                    >
                                        {[
                                            'PIX',
                                            'DINHEIRO',
                                            'CARTAO_CREDITO',
                                            'CARTAO_DEBITO',
                                            'OUTRO',
                                        ].map((value) => (
                                            <option key={value} value={value}>
                                                {value.replaceAll('_', ' ')}
                                            </option>
                                        ))}
                                    </select>
                                </label>
                            </>
                        ) : (
                            <>
                                <label className="field-label">
                                    Descrição
                                    <input
                                        required
                                        value={form.descricao}
                                        onChange={(e) =>
                                            setForm({ ...form, descricao: e.target.value })
                                        }
                                    />
                                </label>
                                <label className="field-label">
                                    Categoria
                                    <select
                                        value={form.categoria}
                                        onChange={(e) =>
                                            setForm({ ...form, categoria: e.target.value })
                                        }
                                    >
                                        {[
                                            'Aluguel',
                                            'Energia',
                                            'Produtos',
                                            'Manutenção',
                                            'Marketing',
                                            'Outros',
                                        ].map((value) => (
                                            <option key={value}>{value}</option>
                                        ))}
                                    </select>
                                </label>
                                <label className="field-label">
                                    Data
                                    <input
                                        required
                                        type="date"
                                        value={form.data}
                                        onChange={(e) => setForm({ ...form, data: e.target.value })}
                                    />
                                </label>
                            </>
                        )}
                        <label className="field-label">
                            Valor (R$)
                            <input
                                required
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={form.valor}
                                onChange={(e) => setForm({ ...form, valor: e.target.value })}
                            />
                        </label>
                        <button
                            className="btn-red full-width"
                            disabled={
                                busy || (modal === 'Receita' && !finance.data?.pendencias?.length)
                            }
                        >
                            Registrar {modal.toLowerCase()}
                        </button>
                    </form>
                </Modal>
            )}
        </>
    );
}
