'use client';
import { useState } from 'react';
import { FiPlus, FiEdit2 } from 'react-icons/fi';
import useApi from '../../hooks/useApi';
import { api, API_URL, money } from '../../services/api';
import { imagemServico } from '../../config/imagens';
import Photo from '../../components/ui/Photo';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import { Notice, Loading, Empty } from '../../components/ui/Feedback';
const emptyForm = { nome: '', descricao: '', valor: '', duracao: '', imagem: '', ativo: true };
export default function ServicesPage() {
    const services = useApi('/servicos?todos=true');
    const [form, setForm] = useState(null);
    const [message, setMessage] = useState('');
    const [busy, setBusy] = useState(false);
    const [uploading, setUploading] = useState(false);
    async function upload(file) {
        if (!file) return;
        setUploading(true);
        try {
            const body = new FormData();
            body.append('imagem', file);
            const result = await api('/admin/imagens', { method: 'POST', body });
            setForm((form) => ({ ...form, imagem: API_URL + result.url }));
        } catch (error) {
            setMessage(error.message);
        } finally {
            setUploading(false);
        }
    }
    async function save(event) {
        event.preventDefault();
        setBusy(true);
        try {
            await api(form.id ? `/servicos/${form.id}` : '/servicos', {
                method: form.id ? 'PUT' : 'POST',
                body: JSON.stringify(form),
            });
            setForm(null);
            services.reload();
            setMessage('Serviço salvo.');
        } catch (error) {
            setMessage(error.message);
        } finally {
            setBusy(false);
        }
    }
    return (
        <>
            <PageHeader
                title="Serviços"
                subtitle="Preços, duração e o cuidado com cada detalhe."
                action={
                    <button
                        className="btn-red"
                        onClick={() => {
                            setMessage('');
                            setForm({ ...emptyForm });
                        }}
                    >
                        <FiPlus /> Adicionar
                    </button>
                }
            />
            <Notice>{!form && (message || services.error)}</Notice>
            {services.loading ? (
                <Loading />
            ) : !services.data?.length ? (
                <Empty>Nenhum serviço cadastrado.</Empty>
            ) : (
                <div className="management-grid">
                    {services.data.map((item) => (
                        <article className="list-card manage-service" key={item.ser_id}>
                            <Photo src={imagemServico(item)} alt={item.ser_nome} />
                            <div className="list-copy">
                                <strong>{item.ser_nome}</strong>
                                <b>{money(item.ser_valor)}</b>
                                <small>
                                    {item.ser_duracao} min · {item.realizados} realizados
                                </small>
                                <span
                                    className={`status ${item.ser_ativo ? 'status-confirmado' : 'status-cancelado'}`}
                                >
                                    {item.ser_ativo ? 'Ativo' : 'Inativo'}
                                </span>
                            </div>
                            <button
                                className="icon-button"
                                aria-label={`Editar ${item.ser_nome}`}
                                onClick={() => {
                                    setMessage('');
                                    setForm({
                                        id: item.ser_id,
                                        nome: item.ser_nome,
                                        descricao: item.ser_descricao || '',
                                        valor: item.ser_valor,
                                        duracao: item.ser_duracao,
                                        imagem: item.ser_imagem || '',
                                        ativo: item.ser_ativo,
                                    });
                                }}
                            >
                                <FiEdit2 />
                            </button>
                        </article>
                    ))}
                </div>
            )}
            {form && (
                <Modal
                    title={form.id ? 'Editar serviço' : 'Novo serviço'}
                    onClose={() => setForm(null)}
                >
                    <Notice>{message}</Notice>
                    <form onSubmit={save}>
                        <label className="field-label">
                            Nome
                            <input
                                required
                                value={form.nome}
                                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                            />
                        </label>
                        <label className="field-label">
                            Descrição
                            <textarea
                                value={form.descricao}
                                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                            />
                        </label>
                        <div className="form-columns">
                            <label className="field-label">
                                Preço (R$)
                                <input
                                    required
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={form.valor}
                                    onChange={(e) => setForm({ ...form, valor: e.target.value })}
                                />
                            </label>
                            <label className="field-label">
                                Duração (min)
                                <input
                                    required
                                    type="number"
                                    min="5"
                                    max="600"
                                    value={form.duracao}
                                    onChange={(e) => setForm({ ...form, duracao: e.target.value })}
                                />
                            </label>
                        </div>
                        <label className="field-label">
                            Foto do serviço
                            <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                onChange={(e) => upload(e.target.files?.[0])}
                            />
                            <small>JPG, PNG ou WebP, até 3 MB.</small>
                        </label>
                        {form.imagem && <Photo src={form.imagem} alt="Foto selecionada" />}
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={form.ativo}
                                onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
                            />{' '}
                            Serviço ativo
                        </label>
                        <button className="btn-red full-width" disabled={busy || uploading}>
                            {uploading ? 'Enviando foto...' : 'Salvar serviço'}
                        </button>
                    </form>
                </Modal>
            )}
        </>
    );
}
