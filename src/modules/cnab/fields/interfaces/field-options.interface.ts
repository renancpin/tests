import { CasingTypes } from "../enum/casing-types.enum";
import { FieldTypes } from "../enum/field-types.enum";

export interface FieldOptions {
    type: FieldTypes;
    title?: string;
    length: number;
    casing: CasingTypes;
    decimal?: number;
    format?: string;
    default?: any;
    domain?: Array<any>;
}