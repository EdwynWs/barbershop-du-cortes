import Link from 'next/link';
import { FiChevronRight, FiClock } from 'react-icons/fi';
import Photo from '../ui/Photo';
import { imagemServico } from '../../config/imagens';
import { money } from '../../services/api';

export default function ServiceList({ services, onSelect, selected }) {
    return (
        <div className="service-list">
            {services.map((service) => {
                const content = (
                    <>
                        <Photo src={imagemServico(service)} alt={service.ser_nome} />
                        <span className="list-copy">
                            <strong>{service.ser_nome}</strong>
                            <small>
                                {service.ser_descricao || 'Cuidado e precisão em cada detalhe'}
                            </small>
                            <span className="service-meta">
                                <b>{money(service.ser_valor)}</b>
                                <span>
                                    <FiClock /> {service.ser_duracao} min
                                </span>
                            </span>
                        </span>
                        <FiChevronRight className="list-chevron" />
                    </>
                );
                return onSelect ? (
                    <button
                        key={service.ser_id}
                        className={`list-card ${String(selected) === String(service.ser_id) ? 'is-selected' : ''}`}
                        onClick={() => onSelect(service)}
                    >
                        {content}
                    </button>
                ) : (
                    <Link
                        key={service.ser_id}
                        className="list-card"
                        href={`/cliente/agendar?servico=${service.ser_id}`}
                    >
                        {content}
                    </Link>
                );
            })}
        </div>
    );
}
