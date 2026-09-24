export default function MetricCard({ label, value, icon: Icon, accent = false, caption }) {
    return (
        <article className={`panel metric-card ${accent ? 'metric-accent' : ''}`}>
            {Icon && <Icon className="metric-icon" />}
            <span>{label}</span>
            <strong>{value}</strong>
            {caption && <small>{caption}</small>}
        </article>
    );
}
