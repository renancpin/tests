import { readFileSync } from 'fs';

export class LayoutParser {
    load(filename: string) {
        try {
            const rawdata = readFileSync(`./layouts/${filename}`, 'utf8');
            const layout = JSON.parse(rawdata);

            return layout;
        } catch (e) {
            throw new Error(`ERRO: O layout ${filename} não foi encontrado`);
        }
    }
}
