'use client';
import Link from 'next/link';
import { FiCalendar, FiScissors, FiUsers, FiTag, FiArrowRight, FiClock } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import useApi from '../../hooks/useApi';
import Photo from '../../components/ui/Photo';
import { Notice, Status } from '../../components/ui/Feedback';
import { imagens } from '../../config/imagens';
import { dateLabel, money, today } from '../../services/api';

export default function HomePage() {
    const { user } = useAuth();
    const appointments = useApi('/agendamentos/meus');
    const promotions = useApi('/promocoes');
    const next = [...(appointments.data || [])]
        .filter(
            (item) =>
                item.age_data.slice(0, 10) >= today() &&
                ['AGENDADO', 'CONFIRMADO'].includes(item.age_status)
        )
        .sort((a, b) =>
            `${a.age_data}${a.age_hora_inicio}`.localeCompare(`${b.age_data}${b.age_hora_inicio}`)
        )[0];
    const shortcuts = [
        [FiScissors, 'Nossos serviços', '/cliente/servicos'],
        [FiUsers, 'Nossos barbeiros', '/cliente/barbeiros'],
        [FiCalendar, 'Minha agenda', '/cliente/agenda'],
        [FiTag, 'Promoções', '#promocoes'],
    ];
    return (
        <div className="client-home">
            <div className="greeting">
                <span className="eyebrow">BEM-VINDO À DU CORTES</span>
                <h1>Olá, {user?.nome.split(' ')[0]}!</h1>
                <p>Qual vai ser o estilo hoje?</p>
            </div>
            <div className="home-layout">
                <div>
                    <div className="style-banner">
                        <Photo
                            src={imagens.banner}
                            alt="Estilo Du Cortes"
                            className="banner-photo"
                        />
                        <div className="banner-copy">
                            <small>SEU ESTILO, SUA MARCA.</small>
                            <h2>
                                ESTILO
                                <br />É ATITUDE<span>.</span>
                            </h2>
                            <span className="banner-line" />
                        </div>
                    </div>
                    <Link className="btn-red full-width booking-cta" href="/cliente/agendar">
                        <FiCalendar /> Agendar horário <FiArrowRight />
                    </Link>
                    <div className="shortcut-grid">
                        {shortcuts.map(([Icon, label, href]) => (
                            <Link href={href} key={label}>
                                <Icon />
                                <span>{label}</span>
                            </Link>
                        ))}
                    </div>
                </div>
                <div className="home-secondary">
                    {next && (
                        <section>
                            <div className="section-heading">
                                <h2>Seu próximo horário</h2>
                                <Link href="/cliente/agenda">
                                    Ver agenda <FiArrowRight />
                                </Link>
                            </div>
                            <div className="panel next-appointment">
                                <div className="date-tile">
                                    <span>
                                        {dateLabel(next.age_data, { month: 'short' }).split(' ')[2]}
                                    </span>
                                    <strong>{next.age_data.slice(8, 10)}</strong>
                                </div>
                                <div>
                                    <Status value={next.age_status} />
                                    <h3>{next.ser_nome}</h3>
                                    <p>
                                        {next.barbeiro} · <FiClock />{' '}
                                        {next.age_hora_inicio.slice(0, 5)}
                                    </p>
                                </div>
                            </div>
                        </section>
                    )}
                    <section id="promocoes">
                        <div className="section-heading">
                            <h2>Promoções da semana</h2>
                            <FiTag />
                        </div>
                        <Notice>{promotions.error}</Notice>
                        {promotions.data?.length ? (
                            promotions.data.map((promo) => (
                                <Link
                                    className="promotion-card"
                                    key={promo.pro_id}
                                    href="/cliente/agendar"
                                >
                                    <Photo src={imagens.banner} alt="" />
                                    <span>
                                        <small>POR TEMPO LIMITADO</small>
                                        <strong>{promo.pro_titulo}</strong>
                                        <span>{promo.pro_descricao}</span>
                                        <b>{money(promo.pro_desconto)} de desconto</b>
                                    </span>
                                    <FiArrowRight />
                                </Link>
                            ))
                        ) : (
                            <div className="panel quiet-promo">
                                <FiScissors />
                                <h3>Seu estilo sempre em dia.</h3>
                                <p>
                                    Reserve um tempo para você. Confira nossos serviços e escolha
                                    seu próximo corte.
                                </p>
                                <Link className="btn-outline" href="/cliente/servicos">
                                    Conhecer serviços <FiArrowRight />
                                </Link>
                            </div>
                        )}
                    </section>
                    <div className="signature">DISCIPLINA TAMBÉM É ESTILO.</div>
                </div>
            </div>
            <Notice>{appointments.error}</Notice>
        </div>
    );
}
