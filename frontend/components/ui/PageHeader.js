import Link from 'next/link';
import { FiArrowLeft } from 'react-icons/fi';
export default function PageHeader({ title, subtitle, back, action }) {
    return (
        <div className="page-heading">
            <div>
                {back && (
                    <Link className="back-link" href={back}>
                        <FiArrowLeft /> Voltar
                    </Link>
                )}
                <h1>{title}</h1>
                {subtitle && <p>{subtitle}</p>}
            </div>
            {action}
        </div>
    );
}
