'use client';
import { useEffect, useRef, useState } from 'react';
import { FiScissors, FiUser } from 'react-icons/fi';

export default function Photo({ src, alt = '', className = '', person = false }) {
    const [failed, setFailed] = useState(false);
    const photo = useRef(null);

    useEffect(() => {
        setFailed(Boolean(photo.current?.complete && photo.current.naturalWidth === 0));
    }, [src]);
    return (
        <span className={`photo ${person ? 'photo-person' : ''} ${className}`}>
            {src && !failed ? (
                <img ref={photo} src={src} alt={alt} onError={() => setFailed(true)} />
            ) : (
                <span className="photo-fallback" aria-label={alt}>
                    {person ? <FiUser /> : <FiScissors />}
                </span>
            )}
        </span>
    );
}
