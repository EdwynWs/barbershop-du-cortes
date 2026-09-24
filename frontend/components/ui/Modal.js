'use client';
import { useEffect, useRef } from 'react';
import { FiX } from 'react-icons/fi';
export default function Modal({ title, onClose, children }) {
    const dialog = useRef(null);
    useEffect(() => {
        dialog.current.showModal();
    }, []);
    return (
        <dialog
            className="app-dialog"
            ref={dialog}
            onCancel={onClose}
            onClick={(e) => {
                if (e.target === dialog.current) onClose();
            }}
        >
            <div className="dialog-heading">
                <h2>{title}</h2>
                <button className="icon-button" aria-label="Fechar" onClick={onClose}>
                    <FiX />
                </button>
            </div>
            {children}
        </dialog>
    );
}
