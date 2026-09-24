'use client';
import { useState } from 'react';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { today } from '../../services/api';
export default function Calendar({ value, onChange }) {
    const [month, setMonth] = useState(() => new Date(`${value || today()}T12:00:00`));
    const year = month.getFullYear();
    const number = month.getMonth();
    const first = (new Date(year, number, 1).getDay() + 6) % 7;
    const count = new Date(year, number + 1, 0).getDate();
    const key = (day) =>
        `${year}-${String(number + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return (
        <div className="calendar">
            <div className="calendar-heading">
                <strong>
                    {month.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </strong>
                <div>
                    <button
                        className="icon-button"
                        aria-label="Mês anterior"
                        onClick={() => setMonth(new Date(year, number - 1, 1))}
                    >
                        <FiChevronLeft />
                    </button>
                    <button
                        className="icon-button"
                        aria-label="Próximo mês"
                        onClick={() => setMonth(new Date(year, number + 1, 1))}
                    >
                        <FiChevronRight />
                    </button>
                </div>
            </div>
            <div className="calendar-grid">
                {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((day) => (
                    <small key={day}>{day}</small>
                ))}
                {Array.from({ length: first }, (_, i) => (
                    <span key={`empty-${i}`} />
                ))}
                {Array.from({ length: count }, (_, i) => i + 1).map((day) => (
                    <button
                        key={day}
                        disabled={key(day) < today()}
                        className={value === key(day) ? 'selected' : ''}
                        onClick={() => onChange(key(day))}
                    >
                        {day}
                    </button>
                ))}
            </div>
        </div>
    );
}
