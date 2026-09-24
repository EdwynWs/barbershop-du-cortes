'use client';
import { useState } from 'react';
import { FiPlus, FiTag } from 'react-icons/fi';
import useApi from '../../hooks/useApi';
import { api, today, dateLabel, money } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import { Notice, Loading, Empty } from '../../components/ui/Feedback';
export default function PromotionsPage() {
    const promotions = useApi('/promocoes');
    const [form, setForm] = useState(null);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    async function save(event) {
        event.preventDefault();
        setBusy(true);
        try {
            await api('/admin/promocoes', { method: 'POST', body: JSON.stringify(form) });
            setForm(null);
            promotions.reload();
        } catch (error) {
            setError(error.message);
        } finally {
            setBusy(false);
        }
    }
    return (
        <>
            <PageHeader
                title="Promoções"
                subtitle="Novos motivos para voltar à barbearia."
                action={
                    <button
                        className="btn-red"
                        onClick={() => {
                            setError('');
                            setForm({
                                titulo: '',
                                descricao: '',
                                desconto: '',
                                inicio: today(),
                                fim: today(),
                            });
                        }}
                    >
                        <FiPlus /> Criar promoção
                    </button>
                }
            />
            <Notice>{!form && promotions.error}</Notice>
            {promotions.loading ? (
                <Loading />
            ) : !promotions.data?.length ? (
                <Empty>Nenhuma promoção ativa no momento.</Empty>
            ) : (
                <div className="management-grid">
                    {promotions.data.map((item) => (
                        <div className="panel promo-admin" key={item.pro_id}>
                            <FiTag />
                            <small>PROMOÇÃO ATIVA</small>
                            <h2>{item.pro_titulo}</h2>
                            <p>{item.pro_descricao}</p>
                            <strong>{money(item.pro_desconto)} de desconto</strong>
                            <p>Até {dateLabel(item.pro_data_fim)}</p>
                        </div>
                    ))}
                </div>
            )}
            {form && (
                <Modal title="Nova promoção" onClose={() => setForm(null)}>
                    <Notice>{error}</Notice>
                    <form onSubmit={save}>
                        {[
                            ['titulo', 'Título', 'text'],
                            ['descricao', 'Descrição', 'text'],
                            ['desconto', 'Desconto em reais', 'number'],
                            ['inicio', 'Começa em', 'date'],
                            ['fim', 'Termina em', 'date'],
                        ].map(([key, label, type]) => (
                            <label className="field-label" key={key}>
                                {label}
                                <input
                                    required={key !== 'descricao'}
                                    type={type}
                                    min={type === 'number' ? '0' : undefined}
                                    step={type === 'number' ? '0.01' : undefined}
                                    value={form[key]}
                                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                                />
                            </label>
                        ))}
                        <button className="btn-red full-width" disabled={busy}>
                            Salvar promoção
                        </button>
                    </form>
                </Modal>
            )}
        </>
    );
}
