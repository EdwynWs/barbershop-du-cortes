import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/global.css';
import { AuthProvider } from '../contexts/AuthContext';
export const metadata = {
    title: 'Barbershop Du Cortes',
    description: 'Mais que um corte, é atitude.',
};
export default function Layout({ children }) {
    return (
        <html lang="pt-BR">
            <body>
                <AuthProvider>{children}</AuthProvider>
            </body>
        </html>
    );
}
