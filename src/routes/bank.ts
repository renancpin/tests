import express, { NextFunction, Request, Response } from 'express';
import BilletAPI from '../modules/bank-api/bank-api.service';

const router = express.Router();

router.get(
    '/consult-billet/:barCode',
    (req: Request, res: Response, next: NextFunction) => {
        const { barCode } = req.params;

        BilletAPI.consultBillet(barCode)
            .then((response) => {
                if (!response) {
                    res.status(400).send({
                        status: 400,
                        error: 'Invalid bar code or digitable line',
                    });
                } else {
                    res.send(response);
                }
            })
            .catch((error) => {
                next(error);
            });
    },
);

router.get('/generate-jwt', (req: Request, res: Response) => {
    const jwt = BilletAPI.generateJwt();

    res.send({ jwt });
});

router.post('/sign-request', async (req: Request, res: Response) => {
    const request = req.body;
    const payload = await BilletAPI.signRequest(request);

    res.send(payload);
});

router.post(
    '/make-request',
    async (req: Request, res: Response, next: NextFunction) => {
        const request = req.body;
        const response = BilletAPI.makeRequest(request);

        await response
            .then((response) => {
                Object.keys(response.headers).forEach((key) => {
                    res.setHeader(key, response.headers[key]);
                });

                res.status(response.status).send(response.data);
            })
            .catch((error) => {
                next(error);
            });
    },
);

export default router;
