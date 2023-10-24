import { Geraet } from "../models/einweisung.model";

export class EinweisungResponse {
    sicherheitsbelehrung: boolean | null;
    datum: string;
    geraet: Geraet | null;
    class: string;
    mentor: boolean | null;
}
