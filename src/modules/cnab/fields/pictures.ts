// ex: <titulo>
const titlePart = '(?:\\<(?<title>\\w+)\\>)?',
    // ex: (13)
    lengthPart = '\\((?<length>\\d+)\\)',
    // ex: (2)      - para numeros
    decimalPart = '(?:\\((?<decimal>\\d+)\\))?',
    // ex: (L), (U) - para strings
    casingPart = '(?:\\((?<casing>U|L)\\))?',
    // ex: dd
    dayPart = '(?=[^d]*(?<d>d*))',
    // ex: mm
    monthPart = '(?=[^m]*(?<m>m*))',
    // ex: yyyy
    yearPart = '(?=[^ya]*(?<y>[ya]*))';

/** Exemplo:    mm/dd/yy   - data no formato americano,
 *              ddmm       - data parcial,
 */
const dateFormat = new RegExp(
    '^' + titlePart + '(?<format>' + dayPart + monthPart + yearPart + '.*)$',
    'i',
);

/** Exemplo:    A(20)      - string de 20 caracteres
 *              A(10)(L)   - string de 10 caract. em lower case
 */
const stringPicture = new RegExp(
    '^' + titlePart + 'A' + lengthPart + casingPart + '$',
    'i',
);

/** Exemplo:    N(20)      - numero de 20 casas
 *              N(10)(2)   - numero de 10 casas sendo 2 decimais
 */
const numberPicture = new RegExp(
    '^' + titlePart + 'N' + lengthPart + decimalPart + '$',
    'i',
);

export { stringPicture, numberPicture, dateFormat };
