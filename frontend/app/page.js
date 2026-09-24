import Link from 'next/link';
import { FiCalendar, FiArrowRight, FiScissors } from 'react-icons/fi';
import Brand from '../components/ui/Brand';
import Photo from '../components/ui/Photo';
import { imagens } from '../config/imagens';
export default function LandingPage() {
    return (
        <main className="landing-page">
            <Photo
                src={imagens.ambiente}
                alt="Barbershop Du Cortes"
                className="landing-background"
            />
            <header>
                <Brand compact />
                <Link className="btn-outline" href="/login">
                    Entrar <FiArrowRight />
                </Link>
            </header>
            <div className="landing-content">
                <span className="eyebrow">BARBERSHOP DU CORTES</span>
                <h1>
                    MAIS QUE
                    <br />
                    UM CORTE.
                    <br />
                    <span>É ATITUDE.</span>
                </h1>
                <p>
                    Seu estilo na palma da mão.
                    <br />
                    Escolha seu serviço e reserve seu horário com o Eduardo.
                </p>
                <Link className="btn-red" href="/login">
                    <FiCalendar /> Agendar meu horário <FiArrowRight />
                </Link>
                <div className="landing-details">
                    <span>
                        <FiScissors /> Cortes modernos
                    </span>
                    <span>Barba na régua</span>
                    <span>Atendimento de qualidade</span>
                </div>
            </div>
            <footer>DISCIPLINA TAMBÉM É ESTILO.</footer>
        </main>
    );
}
