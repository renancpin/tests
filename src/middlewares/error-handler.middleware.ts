import { Request, Response, NextFunction } from 'express';

export function jsonErrorHandler(
    err: unknown,
    req: Request,
    res: Response,
    next: NextFunction,
) {
    try {
        const { message, status, statusCode, data } = err as {
            message?: string;
            status?: number;
            statusCode?: number;
            data?: Record<string, unknown>;
        };

        res.status(status ?? statusCode ?? 500).send({
            status,
            message:
                message?.replace?.(/[\n\r]/g, '').replace(/\s{2,}/g, ' ') ??
                'Encontramos um problema',
            data,
        });
    } catch (error) {
        next(error);
    }
}

export function defaultNotFoundErrorHandler(req: Request, res: Response) {
    res.status(404).send({
        status: 404,
        message: 'Parece que não encontramos esta página ou recurso.',
    });
}

type ErrorHandlerMiddleware =
    | ((req: Request, res: Response) => void)
    | ((err: unknown, req: Request, res: Response, next: NextFunction) => void);

const errorHandlers: () => ErrorHandlerMiddleware[] = () => [
    defaultNotFoundErrorHandler,
    jsonErrorHandler,
];
export default errorHandlers;
