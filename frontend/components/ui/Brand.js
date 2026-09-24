'use client';
import { useEffect, useRef, useState } from 'react';
import { FiScissors } from 'react-icons/fi';
import { imagens } from '../../config/imagens';

export default function Brand({ compact = false }) {
    const [hasLogo, setHasLogo] = useState(true);
    const logo = useRef(null);

    useEffect(() => {
        if (logo.current?.complete && logo.current.naturalWidth === 0) {
            setHasLogo(false);
        }
    }, []);

    return (
        <div className={`brand ${compact ? 'brand-compact' : ''}`}>
            {hasLogo ? (
                <img
                    ref={logo}
                    src={imagens.logo}
                    alt="Barbershop Du Cortes"
                    onError={() => setHasLogo(false)}
                />
            ) : (
                <div className="brand-mark">
                    <span className="brand-scissors">
                        <FiScissors />
                    </span>
                    <span>
                        BARBERSHOP<strong>DU CORTES</strong>
                        <small>ESTILO & ATITUDE</small>
                    </span>
                </div>
            )}
        </div>
    );
}
