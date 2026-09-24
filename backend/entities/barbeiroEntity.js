import { fail } from '../middlewares/error.js';
import { validTime, minutes } from './appointment.js';
export default class BarbeiroEntity {
    constructor(values) {
        Object.assign(this, values);
    }
    validar(cadastro = false) {
        if (!this.nome?.trim() || !/^\S+@\S+\.\S+$/.test(this.email || '')) {
            fail('Informe o nome e um email válido.');
        }
        if (cadastro && (!this.senha || this.senha.length < 8))
            fail('A senha precisa ter pelo menos 8 caracteres.');
        if (
            !Array.isArray(this.servicos) ||
            !this.servicos.length ||
            this.servicos.some((id) => !Number.isInteger(Number(id)) || Number(id) <= 0)
        )
            fail('Selecione os serviços realizados.');
        if (!Array.isArray(this.horarios)) fail('Informe os horários de trabalho.');
        const days = new Set();
        for (const horario of this.horarios) {
            if (
                !Number.isInteger(horario.dia) ||
                horario.dia < 0 ||
                horario.dia > 6 ||
                days.has(horario.dia)
            )
                fail('Dias de trabalho inválidos.');
            days.add(horario.dia);
            if (
                !validTime(horario.inicio) ||
                !validTime(horario.fim) ||
                minutes(horario.inicio) >= minutes(horario.fim)
            )
                fail('Verifique os horários de entrada e saída.');
            if (horario.intervaloInicio || horario.intervaloFim) {
                if (
                    !validTime(horario.intervaloInicio) ||
                    !validTime(horario.intervaloFim) ||
                    minutes(horario.intervaloInicio) >= minutes(horario.intervaloFim) ||
                    minutes(horario.intervaloInicio) < minutes(horario.inicio) ||
                    minutes(horario.intervaloFim) > minutes(horario.fim)
                )
                    fail('O intervalo precisa ficar dentro do expediente.');
            }
        }
        return true;
    }
}
