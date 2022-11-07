export function parseBarCode(barCodeOrDigitableLine: string) {
    const candidate = barCodeOrDigitableLine.replace(/[^0-9]/g, '');

    if (candidate.length == 44) {
        return candidate;
    }

    const barCode =
        candidate.substring(0, 4) +
        candidate.substring(32, 48) +
        candidate.substring(4, 9) +
        candidate.substring(10, 20) +
        candidate.substring(21, 31);

    return barCode;
}

export function parseDigitableLine(barCodeOrDigitableLine: string) {
    const candidate = barCodeOrDigitableLine.replace(/[^0-9]/g, '');

    if (candidate.length == 47 || candidate.length == 48) {
        return candidate;
    }

    const campo1 = candidate.substring(0, 4) + candidate.substring(19, 24);
    const digito1 = digitoVerificador(campo1);

    const campo2 = candidate.substring(24, 34);
    const digito2 = digitoVerificador(campo2);

    const campo3 = candidate.substring(34, 44);
    const digito3 = digitoVerificador(campo3);

    const digitoGeral = candidate.substring(4, 5);

    const fatorVencimento = candidate.substring(5, 9);
    const valor = candidate.substring(9, 19);

    const digitableLine =
        campo1 +
        digito1 +
        campo2 +
        digito2 +
        campo3 +
        digito3 +
        digitoGeral +
        fatorVencimento +
        valor;

    return digitableLine.replace(
        /^(\d{5})(\d{5})(\d{5})(\d{6})(\d{5})(\d{6})(\d)(\d{14})$/,
        '$1.$2 $3.$4 $5.$6 $7 $8',
    );
}

export function digitoVerificador(campo: string) {
    const ultimoChar = campo.length - 1;
    let sum = 0;
    let fator: number;
    let item: number;

    for (let i = ultimoChar; i >= 0; i--) {
        fator = (ultimoChar - i) % 2 == 0 ? 2 : 1;
        item = fator * Number(campo.charAt(i));
        if (item > 9) item = Math.trunc(item / 10) + (item % 10);
        sum += item;
    }

    const resto = sum % 10;
    const digito = (10 - resto).toString();

    return digito;
}
