export class Einweisung {
    geraet: Geraet | null;
    datum: string;
    sicherheitsbelehrung: boolean;
    class: string;
    mentor: boolean;
    aktiviert: boolean;
}


export class Geraet {
    cn: string | null;
    dn: string;
    geraetname: string;
}