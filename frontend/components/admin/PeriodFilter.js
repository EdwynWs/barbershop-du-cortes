'use client';
import { today } from '../../services/api';
export default function PeriodFilter({ value, onChange }) {
    function selectPeriod(type) {
        const base = new Date(today() + 'T12:00:00');
        let start = new Date(base),
            end = new Date(base);
        if (type === 'Semana') {
            start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
            end = new Date(start);
            end.setDate(end.getDate() + 6);
        }
        if (type === 'Mês') {
            start.setDate(1);
            end = new Date(base.getFullYear(), base.getMonth() + 1, 0, 12);
        }
        if (type === 'Ano') {
            start = new Date(base.getFullYear(), 0, 1, 12);
            end = new Date(base.getFullYear(), 11, 31, 12);
        }
        onChange({ inicio: start.toISOString().slice(0, 10), fim: end.toISOString().slice(0, 10) });
    }
    return (
        <div className="period-filter">
            <div className="tabs compact">
                {['Hoje', 'Semana', 'Mês', 'Ano'].map((item) => (
                    <button key={item} onClick={() => selectPeriod(item)}>
                        {item}
                    </button>
                ))}
            </div>
            <div className="date-range">
                <label>
                    De
                    <input
                        type="date"
                        value={value.inicio}
                        onChange={(e) => onChange({ ...value, inicio: e.target.value })}
                    />
                </label>
                <label>
                    Até
                    <input
                        type="date"
                        value={value.fim}
                        onChange={(e) => onChange({ ...value, fim: e.target.value })}
                    />
                </label>
            </div>
        </div>
    );
}
