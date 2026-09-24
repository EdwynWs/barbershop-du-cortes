'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
    FiHome,
    FiCalendar,
    FiUsers,
    FiScissors,
    FiUser,
    FiDollarSign,
    FiBarChart2,
    FiTag,
    FiSettings,
    FiLogOut,
    FiBell,
    FiMenu,
    FiX,
    FiMoreHorizontal,
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import Brand from '../ui/Brand';
import { Loading } from '../ui/Feedback';

const adminLinks = [
    ['dashboard', 'Dashboard', FiHome],
    ['agenda', 'Agenda', FiCalendar],
    ['clientes', 'Clientes', FiUsers],
    ['servicos', 'Serviços', FiScissors],
    ['barbeiros', 'Barbeiros', FiUser],
    ['financeiro', 'Financeiro', FiDollarSign],
    ['promocoes', 'Promoções', FiTag],
    ['relatorios', 'Relatórios', FiBarChart2],
    ['configuracoes', 'Configurações', FiSettings],
];
const clientLinks = [
    ['home', 'Início', FiHome],
    ['agendar', 'Agendar', FiCalendar],
    ['servicos', 'Serviços', FiScissors],
    ['perfil', 'Perfil', FiUser],
];
const barberLinks = [
    ['agenda', 'Agenda', FiCalendar],
    ['perfil', 'Perfil', FiUser],
];

export default function AppShell({ role, children }) {
    const { user, loading, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [menuOpen, setMenuOpen] = useState(false);
    const root = role === 'ADMIN' ? 'admin' : role === 'BARBEIRO' ? 'barbeiro' : 'cliente';
    const links = role === 'ADMIN' ? adminLinks : role === 'BARBEIRO' ? barberLinks : clientLinks;
    const bottom =
        role === 'ADMIN'
            ? adminLinks.filter(([key]) =>
                  ['dashboard', 'agenda', 'clientes', 'financeiro'].includes(key)
              )
            : links;
    useEffect(() => {
        if (!loading && !user) router.replace('/login');
        else if (!loading && user.tipo !== role)
            router.replace(
                user.tipo === 'ADMIN'
                    ? '/admin/dashboard'
                    : user.tipo === 'BARBEIRO'
                      ? '/barbeiro/agenda'
                      : '/cliente/home'
            );
    }, [user, loading, role, router]);
    useEffect(() => setMenuOpen(false), [pathname]);
    if (loading || !user || user.tipo !== role) return <Loading />;
    function NavLink({ entry, mobile = false }) {
        const [url, label, Icon] = entry;
        const href = `/${root}/${url}`;
        return (
            <Link
                href={href}
                className={pathname === href ? 'active' : ''}
                aria-current={pathname === href ? 'page' : undefined}
            >
                <Icon />
                <span>{label}</span>
            </Link>
        );
    }
    return (
        <div className={`app-shell shell-${root}`}>
            {menuOpen && (
                <button
                    className="menu-scrim"
                    aria-label="Fechar menu"
                    onClick={() => setMenuOpen(false)}
                />
            )}
            <aside className={`app-sidebar ${menuOpen ? 'is-open' : ''}`}>
                <div className="sidebar-brand">
                    <Brand compact />
                    <button
                        className="icon-button mobile-only"
                        onClick={() => setMenuOpen(false)}
                        aria-label="Fechar menu"
                    >
                        <FiX />
                    </button>
                </div>
                <div className="sidebar-caption">MAIS QUE UM CORTE, É ATITUDE.</div>
                <nav aria-label="Menu principal">
                    {links.map((entry) => (
                        <NavLink key={entry[0]} entry={entry} />
                    ))}
                </nav>
                {role === 'CLIENTE' && (
                    <Link className="sidebar-extra" href="/cliente/agenda">
                        <FiCalendar /> Meus agendamentos
                    </Link>
                )}
                <div className="sidebar-bottom">
                    <span className="small-avatar">{user.nome[0]}</span>
                    <div>
                        <strong>{user.nome}</strong>
                        <small>
                            {role === 'ADMIN'
                                ? 'Administrador'
                                : role === 'BARBEIRO'
                                  ? 'Barbeiro'
                                  : 'Seu estilo em dia'}
                        </small>
                    </div>
                    <button className="icon-button" aria-label="Sair" onClick={logout}>
                        <FiLogOut />
                    </button>
                </div>
            </aside>
            <div className="app-main">
                <header className="app-topbar">
                    <button
                        className="icon-button mobile-only"
                        aria-label="Abrir menu"
                        onClick={() => setMenuOpen(true)}
                    >
                        <FiMenu />
                    </button>
                    <span className="topbar-label">
                        {role === 'ADMIN' ? 'Visão do administrador' : 'Seu estilo. Seu horário.'}
                    </span>
                    <div className="topbar-actions">
                        <span className="live-indicator">DU CORTES</span>
                        {role === 'CLIENTE' ? (
                            <Link
                                className="icon-button"
                                aria-label="Notificações"
                                href="/cliente/notificacoes"
                            >
                                <FiBell />
                            </Link>
                        ) : (
                            <span className="small-avatar">{user.nome[0]}</span>
                        )}
                    </div>
                </header>
                <main className="page-content">{children}</main>
                <footer className="app-footer">
                    BARBERSHOP DU CORTES <span>Mais que um corte, é atitude.</span>
                </footer>
            </div>
            <nav className="bottom-navigation" aria-label="Navegação rápida">
                {bottom.map((entry) => (
                    <NavLink key={entry[0]} entry={entry} mobile />
                ))}
                {role === 'ADMIN' && (
                    <button onClick={() => setMenuOpen(true)}>
                        <FiMoreHorizontal />
                        <span>Mais</span>
                    </button>
                )}
            </nav>
        </div>
    );
}
