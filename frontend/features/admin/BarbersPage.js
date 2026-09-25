'use client';
import { useState } from 'react';
import { FiPlus, FiEdit2 } from 'react-icons/fi';
import useApi from '../../hooks/useApi';
import { api, API_URL } from '../../services/api';
import { imagemBarbeiro } from '../../config/imagens';
import Photo from '../../components/ui/Photo';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import { Notice, Loading, Empty } from '../../components/ui/Feedback';
const blank = {
    nome: '',
    email: '',
    telefone: '',
    senha: '',
    descricao: '',
    foto: '',
    ativo: true,
    servicos: [],
    inicio: '09:00',
    fim: '19:00',
    intervaloInicio: '12:00',
    intervaloFim: '13:00',
    dias: [1, 2, 3, 4, 5, 6],
};
export default function BarbersPage() {
    const barbers = useApi('/admin/barbeiros');
    const services = useApi('/servicos');
    const [form, setForm] = useState(null);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    async function save(event) {
        event.preventDefault();
        setBusy(true);
        const body = {
            ...form,
            horarios: form.dias.map((dia) => ({
                dia,
                inicio: form.inicio,
                fim: form.fim,
                intervaloInicio: form.intervaloInicio,
                intervaloFim: form.intervaloFim,
            })),
        };
        try {
            await api(form.id ? `/barbeiros/${form.id}` : '/barbeiros', {
                method: form.id ? 'PATCH' : 'POST',
                body: JSON.stringify(body),
            });
            setForm(null);
            barbers.reload();
        } catch (error) {
            setError(error.message);
        } finally {
            setBusy(false);
        }
    }
    function edit(item) {
        const first = item.horarios?.[0];
        setError('');
        setForm({
            ...blank,
            id: item.bar_id,
            nome: item.usu_nome || '',
            email: item.usu_email || '',
            telefone: item.usu_telefone || '',
            descricao: item.bar_descricao || '',
            foto: item.bar_foto || '',
            ativo: item.bar_ativo,
            servicos: (item.servicos || []).map(String),
            inicio: first?.hor_inicio?.slice(0, 5) || blank.inicio,
            fim: first?.hor_fim?.slice(0, 5) || blank.fim,
            intervaloInicio: first?.hor_intervalo_inicio?.slice(0, 5) || '',
            intervaloFim: first?.hor_intervalo_fim?.slice(0, 5) || '',
            dias: item.horarios?.map((h) => h.hor_dia_semana) || blank.dias,
        });
    }
    async function upload(file) {
        if (!file) return;
        setBusy(true);
        try {
            const body = new FormData();
            body.append('imagem', file);
            const result = await api('/admin/imagens', { method: 'POST', body });
            setForm((form) => ({ ...form, foto: API_URL + result.url }));
        } catch (error) {
            setError(error.message);
        } finally {
            setBusy(false);
        }
    }
    return (
        <>
            <PageHeader
                title="Seu barbeiro"
                subtitle="Conheça quem vai cuidar do seu estilo."
                action={
                    <button
                        className="btn-red"
                        onClick={() => {
                            setError('');
                            setForm({ ...blank });
                        }}
                    >
                        <FiPlus /> Adicionar
                    </button>
                }
            />
            <Notice>{!form && (error || barbers.error)}</Notice>
            {barbers.loading ? (
                <Loading />
            ) : !barbers.data?.length ? (
                <Empty>Nenhum barbeiro cadastrado.</Empty>
            ) : (
                <div className="management-grid">
                    {barbers.data.map((item) => (
                        <article className="list-card" key={item.bar_id}>
                            <Photo person src={imagemBarbeiro(item)} alt={item.usu_nome} />
                            <div className="list-copy">
                                <strong>{item.usu_nome}</strong>
                                <small>{item.bar_descricao}</small>
                                <span
                                    className={`status ${item.bar_ativo ? 'status-confirmado' : 'status-cancelado'}`}
                                >
                                    {item.bar_ativo ? 'Ativo' : 'Inativo'}
                                </span>
                            </div>
                            <button
                                className="icon-button"
                                aria-label={`Editar ${item.usu_nome}`}
                                onClick={() => edit(item)}
                            >
                                <FiEdit2 />
                            </button>
                        </article>
                    ))}
                </div>
            )}
            {form && (
                <Modal
                    title={form.id ? 'Editar barbeiro' : 'Novo barbeiro'}
                    onClose={() => setForm(null)}
                >
                    <Notice>{error}</Notice>
                    <form onSubmit={save}>
                        {[
                            ['nome', 'Nome', 'text'],
                            ['email', 'Email', 'email'],
                            ['telefone', 'Telefone', 'tel'],
                            ['descricao', 'Especialidade', 'text'],
                        ].map(([key, label, type]) => (
                            <label className="field-label" key={key}>
                                {label}
                                <input
                                    type={type}
                                    required={['nome', 'email'].includes(key)}
                                    value={form[key]}
                                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                                />
                            </label>
                        ))}
                        {!form.id && (
                            <label className="field-label">
                                Senha inicial
                                <input
                                    type="password"
                                    minLength={8}
                                    required
                                    value={form.senha}
                                    onChange={(e) => setForm({ ...form, senha: e.target.value })}
                                />
                            </label>
                        )}
                        <label className="field-label">
                            Foto
                            <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                onChange={(e) => upload(e.target.files?.[0])}
                            />
                        </label>
                        <fieldset>
                            <legend>Serviços realizados</legend>
                            <div className="checkbox-grid">
                                {services.data?.map((item) => (
                                    <label className="checkbox-label" key={item.ser_id}>
                                        <input
                                            type="checkbox"
                                            checked={form.servicos.includes(String(item.ser_id))}
                                            onChange={(e) =>
                                                setForm({
                                                    ...form,
                                                    servicos: e.target.checked
                                                        ? [...form.servicos, String(item.ser_id)]
                                                        : form.servicos.filter(
                                                              (id) => id !== String(item.ser_id)
                                                          ),
                                                })
                                            }
                                        />
                                        {item.ser_nome}
                                    </label>
                                ))}
                            </div>
                        </fieldset>
                        <fieldset>
                            <legend>Dias de trabalho</legend>
                            <div className="day-checkboxes">
                                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(
                                    (label, dia) => (
                                        <label key={dia}>
                                            <input
                                                type="checkbox"
                                                checked={form.dias.includes(dia)}
                                                onChange={(e) =>
                                                    setForm({
                                                        ...form,
                                                        dias: e.target.checked
                                                            ? [...form.dias, dia]
                                                            : form.dias.filter((d) => d !== dia),
                                                    })
                                                }
                                            />
                                            {label}
                                        </label>
                                    )
                                )}
                            </div>
                        </fieldset>
                        <div className="form-columns">
                            {[
                                ['inicio', 'Entrada'],
                                ['fim', 'Saída'],
                                ['intervaloInicio', 'Início do intervalo'],
                                ['intervaloFim', 'Fim do intervalo'],
                            ].map(([key, label]) => (
                                <label className="field-label" key={key}>
                                    {label}
                                    <input
                                        type="time"
                                        required={['inicio', 'fim'].includes(key)}
                                        value={form[key]}
                                        onChange={(e) =>
                                            setForm({ ...form, [key]: e.target.value })
                                        }
                                    />
                                </label>
                            ))}
                        </div>
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={form.ativo}
                                onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
                            />{' '}
                            Barbeiro ativo
                        </label>
                        <button className="btn-red full-width" disabled={busy}>
                            Salvar barbeiro
                        </button>
                    </form>
                </Modal>
            )}
        </>
    );
}
