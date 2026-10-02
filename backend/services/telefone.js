export function telefoneBrasil(valor) {
    const texto = String(valor ?? '').trim();
    if (!/^[+\d\s().-]+$/.test(texto)) return null;
    let digitos = texto.replace(/\D/g, '');
    if (digitos.length === 10 || digitos.length === 11) digitos = '55' + digitos;
    if (!/^55[1-9]\d(?:[2-5]\d{7}|9\d{8})$/.test(digitos)) return null;
    return '+' + digitos;
}
