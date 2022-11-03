import { Request, Response, NextFunction } from 'express';

export default function JsonErrorHandler(
    err: { message: string; status?: number; statusCode?: number },
    req: Request,
    res: Response,
    next: NextFunction,
) {
    try {
        const { message, status } = err;

        res.status(status ?? 500).send({
            status,
            message: message.replace(/[\n\r]/g, '').replace(/\s{2,}/g, ' '),
        });
    } catch (error) {
        next(error);
    }
}
