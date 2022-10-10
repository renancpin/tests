import express, { Request, Response } from 'express';
import BilletAPI from '../modules/bank-api/bank-api.service';

const router = express.Router();

router.post('/consult-billet', (req: Request, res: Response) => {
    const { barCode } = req.body;

    BilletAPI.consultBillet(barCode).then((response) => {
        if (!response) {
            res.status(400).send({
                status: 400,
                error: 'Invalid bar code or digitable line',
            });
        } else {
            res.send(response);
        }
    });
});

router.post('/sign-request', async (req: Request, res: Response) => {
    const request = req.body;
    const payload = await BilletAPI.signRequest(request);

    res.send(payload);
});

router.get('/generate-jwt', (req: Request, res: Response) => {
    const jwt = BilletAPI.generateJwt();

    res.send({ jwt });
});

export default router;
