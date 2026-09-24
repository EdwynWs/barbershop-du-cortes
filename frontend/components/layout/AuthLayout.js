import Brand from '../ui/Brand';
import Photo from '../ui/Photo';
import { imagens } from '../../config/imagens';
export default function AuthLayout({ children }) {
    return (
        <div className="auth-layout">
            <aside className="auth-story">
                <Photo
                    src={imagens.ambiente}
                    alt="Ambiente da barbearia"
                    className="auth-background"
                />
                <div className="auth-story-content">
                    <Brand />
                    <h2>
                        MAIS QUE
                        <br />
                        UM CORTE.
                        <br />
                        <span>É ATITUDE.</span>
                    </h2>
                    <p>Seu estilo na palma da mão.</p>
                    <span className="signature">DISCIPLINA TAMBÉM É ESTILO.</span>
                </div>
            </aside>
            <main className="auth-main">
                <div className="auth-box">
                    <Brand />
                    {children}
                </div>
                <small className="auth-copyright">BARBERSHOP DU CORTES · ESTILO & ATITUDE</small>
            </main>
        </div>
    );
}
