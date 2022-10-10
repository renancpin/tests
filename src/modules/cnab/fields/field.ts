import { CasingTypes } from './enum/casing-types.enum.js';
import { FieldTypes } from './enum/field-types.enum.js';
import { FieldOptions } from './interfaces/field-options.interface.js';
import { stringPicture, numberPicture, dateFormat } from './pictures.js';

class Field implements FieldOptions {
    type: FieldTypes;
    title?: string;
    length = 0;
    casing = CasingTypes.NO_CHANGE;
    decimal?: number;
    format?: string;
    default?: any;
    domain?: Array<any>;

    constructor(optionsOrPicture: string | FieldOptions) {
        const options =
            typeof optionsOrPicture === 'string'
                ? this.parsePicture(optionsOrPicture)
                : optionsOrPicture;

        // if (typeof options === 'string') {
        //     /**
        //      * It's either a Picture string eg: A(5), N(21)(2), a(2);
        //      * or a DateFormat eg: mmddyyyy, ddmm
        //      */
        //     options = this.parsePicture(options);
        // }

        if (!options) {
            throw new Error(
                `'${optionsOrPicture}' should be either a Picture string or a FieldOptions object`,
            );
        }

        const { title, type, length, decimal, format, casing } = options;

        this.type = type;

        if (title) {
            this.title = title;
        }

        if (this.type === FieldTypes.ALPHANUMERIC) {
            this.length = length ? +length : 0;
            if (casing) {
                this.casing = casing.toUpperCase();
            }
        } else if (this.type === FieldTypes.NUMERIC) {
            this.length = length ? +length : 0;
            if (decimal) {
                this.decimal = +decimal;
            }
        } else if (this.type === FieldTypes.DATE) {
            this.length = length ? +length : 0;
            this.format = format.toUpperCase();
        }
    }

    private parsePicture(picture: string) {
        const matchesString = picture.match(stringPicture);
        if (matchesString) {
            return {
                type: FieldTypes.ALPHANUMERIC,
                ...matchesString.groups,
            };
        }

        const matchesNumber = picture.match(numberPicture);
        if (matchesNumber) {
            return {
                type: FieldTypes.NUMERIC,
                ...matchesNumber.groups,
            };
        }

        const matchesDate = picture.match(dateFormat);
        if (matchesDate) {
            return {
                type: FieldTypes.DATE,
                length: matchesDate.groups?.format?.length,
                ...matchesDate.groups,
            };
        } else {
            return null;
        }
    }

    static parseString(
        value: string,
        length = 0,
        casing = CasingTypes.NO_CHANGE,
    ) {
        let v = value; //.replace(/[^a-zA-Z0-9\s]/g,'?');

        if (length < 0) {
            length = 0;
        }

        if (casing === CasingTypes.UPPERCASE) {
            v = v.toUpperCase();
        } else if (casing === CasingTypes.LOWERCASE) {
            v = v.toLowerCase();
        }

        if (length > 0) {
            if (v.length > length) {
                v = v.slice(0, length);
            } else if (length > v.length) {
                v = `${v}${' '.repeat(length - v.length)}`;
            }
        }

        return v;
    }

    static parseNumber(value: string | number, length = 0, decimal = 0) {
        let v;

        if (typeof value === 'string') {
            v = value.replace(/\D+/g, '');
        } else if (typeof value === 'number') {
            v = value.toFixed(decimal).replace('.', '');
        } else {
            return '';
        }

        if (length !== 0) {
            if (v.length > length) {
                v = v.slice(v.length - length, v.length);
            } else if (length > v.length) {
                v = `${'0'.repeat(length - v.length)}${v}`;
            }
        }

        return v;
    }

    static parseDate(value: Date | number, format = 'ddmmyyyy') {
        const match = format.match(dateFormat);
        const date = typeof value === 'number' ? new Date(value) : value;

        if (!match || !date) {
            return null;
        }

        const { d, m, y } = match.groups;

        let v = format;

        if (d) {
            v = v.replace(d, this.parseNumber(date.getDate(), d.length));
        }
        if (m) {
            v = v.replace(m, this.parseNumber(date.getMonth() + 1, m.length));
        }
        if (y) {
            v = v.replace(y, this.parseNumber(date.getFullYear(), y.length));
        }

        return v;
    }

    parse(value: string | number | Date) {
        let v = value ? value : this.default ? this.default : '';

        if (this.domain && !Object.keys(this.domain).includes(v)) {
            throw new Error(
                "Value must be one of the options available in 'this.domain'",
            );
        }

        if (this.type === FieldTypes.NUMERIC) {
            v = Field.parseNumber(v, this.length, this.decimal);
        } else if (this.type === FieldTypes.ALPHANUMERIC) {
            v = Field.parseString(v, this.length, this.casing);
        } else if (this.type === FieldTypes.DATE) {
            v = Field.parseDate(v, this.format);
        }

        return v;
    }

    get picture() {
        if (this.type === 'D') {
            return `${this.format}`;
        } else {
            return `${this.type}(${this.length})${
                this.decimal ? `(${this.decimal})` : ''
            }`;
        }
    }
}

export { Field, stringPicture, numberPicture, dateFormat };
