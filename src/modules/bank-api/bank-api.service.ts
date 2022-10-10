import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import axios, { AxiosError, AxiosInstance } from 'axios';
import { URLSearchParams } from 'url';

interface ConsultaFatorDataVencimentoResponse {
    codigoRetorno: number;
    dataVencimento: number;
    fatorVencimento: number;
    bancoTitulo: number;
    nomeBanco: string;
    nomeCedente: string;
    tituloDDA: string;
    permitePagarBoletoComCartaoCredito: string;
    valorTitulo: number;
    consultaCIP: string;
    aceitaPagarComValorDiferenteCalculado: string;
    indPermissaoPagamentoParcial: string;
    cnpjBeneficiario: number;
    cpfCnpjPagador: number;
}

interface ConsultaResponse {
    consultaFatorDataVencimentoResponse: ConsultaFatorDataVencimentoResponse;
}

export interface BilletData {
    barcode: string;
    name: string;
    cpf_cnpj: string;
    amount: string;
    due_date: string;
}

class APIBradesco {
    private axiosInstance: AxiosInstance;
    private apiHost: string;
    private apiClientId: string;
    private privateKey: string;
    private access_token: string;
    private token_expiration: Date;

    constructor() {
        const apiHost = process.env.BILLET_CONSULT_HOST;
        const apiClientId = process.env.BILLET_CONSULT_CLIENTID;
        const privateKey = process.env.BILLET_CONSULT_KEY;

        if (!apiHost) {
            throw new Error('[Billet API] Host not defined');
        }

        if (!apiClientId) {
            throw new Error('[Billet API] ClientId not defined');
        }

        if (!privateKey) {
            throw new Error('[Billet API] Private key not defined');
        }

        const axiosInstance = axios.create({
            baseURL: apiHost,
        });

        this.apiClientId = apiClientId;
        this.apiHost = apiHost;
        this.privateKey = privateKey;
        this.axiosInstance = axiosInstance;
        this.access_token = '';
        this.token_expiration = new Date();
    }

    private async getAccessToken() {
        if (!this.access_token || this.token_expiration < new Date()) {
            const { access_token, expiration } = await this.authenticate();

            this.access_token = access_token ?? '';
            this.token_expiration = expiration ?? this.token_expiration;
        }

        return this.access_token;
    }

    private async authenticate() {
        const route = '/auth/server/v1.1/token';
        const payload = {
            grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            assertion: this.generateJwt(),
        };

        const urlEncodedPayload = new URLSearchParams(payload);

        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
        };

        try {
            const response = await this.axiosInstance.post<{
                access_token: string;
            }>(route, urlEncodedPayload, { headers });

            console.log('[Billet API] Successfully logged in');

            const access_token = response.data?.access_token;
            const expiration = new Date();
            expiration.setHours(expiration.getHours() + 1);

            return { access_token, expiration };
        } catch (error) {
            console.error(error);

            return {};
        }
    }

    generateJwt() {
        const now = new Date();
        const expiration = new Date(now.getTime() + 60 * 60 * 1000);

        const jsonTokenID = now.getTime();
        const issuedAt = Math.round(now.getTime() / 1000);
        const expiresIn = Math.round(expiration.getTime() / 1000);

        const payload = {
            aud: `${this.apiHost}/auth/server/v1.1/token`,
            sub: `${this.apiClientId}`,
            iat: issuedAt,
            exp: expiresIn,
            jti: jsonTokenID,
            ver: '1.1',
        };

        const token = jwt.sign(payload, this.privateKey, {
            algorithm: 'RS256',
        });

        return token;
    }

    async consultBillet(barCodeOrDigitableLine: string) {
        const barCode = this.parseBarCode(barCodeOrDigitableLine);
        const route = '/oapi/v1/pagamentos/boleto/validarDadosTitulo';
        const method = 'POST';
        const payload = {
            agencia: 3995,
            tipoEntrada: 1,
            dadosEntrada: barCode,
        };

        const signedRequest = await this.signRequest({
            url: route,
            method: method,
            payload: payload,
        });
        const { headers } = signedRequest;

        try {
            const response = await this.axiosInstance.post<ConsultaResponse>(
                route,
                JSON.stringify(payload),
                {
                    headers,
                },
            );

            const {
                valorTitulo,
                dataVencimento,
                nomeCedente,
                cnpjBeneficiario,
            } = response.data?.consultaFatorDataVencimentoResponse;

            const billetData: BilletData = {
                barcode: barCode,
                amount: valorTitulo.toFixed(2),
                due_date: dataVencimento
                    .toString()
                    .replace(/^(\d{4})(\d{2})(\d{2}).*/, '$1-$2-$3'),
                name: nomeCedente,
                cpf_cnpj: cnpjBeneficiario.toString(),
            };

            return billetData;
        } catch (error) {
            if (error instanceof AxiosError) {
                console.error({ ...error.response?.data, barCode });
            } else {
                console.error(
                    new Error(
                        `[Billet API] Could not consult billet ${barCode}`,
                    ),
                );
            }
        }
    }

    private parseBarCode(barCodeOrDigitableLine: string) {
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

    async signRequest(params: {
        token?: string;
        url?: string;
        method?: string;
        query?: string[];
        payload?: Record<string, unknown>;
    }) {
        const { method, url, payload, token } = params;
        const access_token = token ?? (await this.getAccessToken());
        const now = new Date();
        const nonce = `${now.getTime()}`;
        const timestamp = `${now.toISOString()}`;

        const request =
            (method ? method.toUpperCase() : 'POST') +
            `\n${url ?? '/'}` + //url
            '\n' + //query params
            `\n${payload ? JSON.stringify(payload) : ''}` + //body
            `\n${access_token}` +
            `\n${nonce}` +
            `\n${timestamp}` +
            '\nSHA256';

        const signature = crypto
            .sign('SHA256', Buffer.from(request), this.privateKey)
            .toString('base64');

        const headers = {
            'Content-Type': 'application/json',
            'X-Brad-Algorithm': 'SHA256',
            'X-Brad-Nonce': `${nonce}`,
            'X-Brad-Timestamp': `${timestamp}`,
            'X-Brad-Signature': `${signature}`,
            Authorization: `Bearer ${access_token}`,
        };

        return {
            nonce,
            timestamp,
            signature,
            access_token,
            headers,
        };
    }
}

export default new APIBradesco();
