import Photo from '../ui/Photo';
import { imagemBarbeiro } from '../../config/imagens';
import { FiCheck } from 'react-icons/fi';
export default function BarberList({ barbers, onSelect, selected }) {
    return (
        <div className="service-list">
            {barbers.map((barber) => (
                <button
                    key={barber.bar_id}
                    className={`list-card ${String(selected) === String(barber.bar_id) ? 'is-selected' : ''}`}
                    onClick={() => onSelect(barber)}
                >
                    <Photo src={imagemBarbeiro(barber)} alt={barber.usu_nome} person />
                    <span className="list-copy">
                        <strong>{barber.usu_nome}</strong>
                        <small>{barber.bar_descricao || 'Cortes, estilo e cuidado'}</small>
                    </span>
                    <span className="selection-circle">
                        {String(selected) === String(barber.bar_id) && <FiCheck />}
                    </span>
                </button>
            ))}
        </div>
    );
}
