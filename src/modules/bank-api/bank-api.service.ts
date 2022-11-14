import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import axios, { AxiosError, AxiosInstance } from 'axios';
import { URLSearchParams } from 'url';
import { parseBarCode, parseDigitableLine } from '../calculos/calculos.service';

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
    barcode?: string;
    digitable_line?: string;
    name: string;
    cpf_cnpj: string;
    amount: string;
    due_date: string;
}

interface Parameters {
    token: string;
    url: string;
    method: string;
    query: string[] | null;
    payload: Record<string, unknown>;
}

type OptionalParameters = Partial<Parameters>;

const defaults: Parameters = {
    token: '',
    url: '/',
    method: 'POST',
    query: null,
    payload: {},
};

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

        this.axiosInstance = axiosInstance;
        this.apiHost = apiHost;
        this.apiClientId = apiClientId;
        this.privateKey = privateKey;
        this.access_token = '';
        this.token_expiration = new Date();
    }

    private async getAccessToken() {
        if (!this.access_token || this.token_expiration < new Date()) {
            const authData = await this.authenticate();

            this.access_token = authData?.access_token ?? '';
            this.token_expiration =
                authData?.expiration ?? this.token_expiration;
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

            const access_token = response.data?.access_token;
            const expiration = new Date();
            expiration.setHours(expiration.getHours() + 1);

            return { access_token, expiration };
        } catch {
            return null;
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
        const barCode = parseBarCode(barCodeOrDigitableLine);
        const digitableLine = parseDigitableLine(barCodeOrDigitableLine);
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
                cpfCnpjPagador,
            } = response.data?.consultaFatorDataVencimentoResponse;

            const beneficiario = (
                cpfCnpjPagador || cnpjBeneficiario
            ).toString();

            const billetData: BilletData = {
                barcode: barCode,
                digitable_line: digitableLine,
                amount: valorTitulo.toFixed(2),
                due_date: dataVencimento
                    .toString()
                    .replace(/^(\d{4})(\d{2})(\d{2}).*/, '$1-$2-$3'),
                name: nomeCedente,
                cpf_cnpj: beneficiario.padStart(
                    beneficiario.length <= 11 ? 11 : 14,
                    '0',
                ),
            };

            return billetData;
        } catch (error) {
            if (error instanceof AxiosError) {
                console.error(error.response?.data ?? error.message);

                if (+(error.response?.status ?? 500) >= 500) {
                    throw {
                        status: error.status,
                        message: error.response?.data ?? error.message,
                    };
                }
            } else {
                console.error(error);
            }

            return null;
        }
    }

    async signRequest(params: OptionalParameters) {
        const { method, url, payload, token, query } = await this.makeDefaults(
            params,
        );

        const access_token = token;
        const now = new Date();
        const nonce = `${now.getTime()}`;
        const timestamp = `${now.toISOString()}`;
        const query_string = query
            ? `?${Object.entries(query)
                  .map((pair) => pair.join('='))
                  .join('&')}`
            : '';
        const payload_string = payload ? JSON.stringify(payload) : '';

        const request =
            method.toUpperCase() +
            `\n${url}` +
            `\n${query_string}` +
            `\n${payload_string}` +
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

    async makeRequest(params: OptionalParameters) {
        const defaults = await this.makeDefaults(params);
        const { method, url, payload } = defaults;

        const signedRequest = await this.signRequest({ ...defaults });
        const { headers } = signedRequest;

        try {
            const response = await this.axiosInstance.request({
                method,
                url,
                data: JSON.stringify(payload),
                headers,
            });

            return response;
        } catch (error) {
            if (error instanceof AxiosError) {
                const status = +(error.status ?? error.response?.status ?? 500);

                throw {
                    status,
                    message: error.message ?? error.response?.statusText,
                    data: error.response?.data,
                };
            } else {
                throw error;
            }
        }
    }

    async makeDefaults(
        params: OptionalParameters,
        customDefaults?: OptionalParameters,
    ): Promise<Parameters> {
        return Object.assign(
            {},
            defaults,
            {
                token: await this.getAccessToken(),
            },
            customDefaults,
            params,
        );
    }
}

export default new APIBradesco();
