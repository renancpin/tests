import express, { Request, Response } from 'express';
import { parseDigitableLine } from '../modules/calculos/calculos.service';

const router = express.Router();

router.post('/calcula-linha-digitavel', (req: Request, res: Response) => {
    const codBarras = req.body.codBarras;

    const linhaDigitavel = parseDigitableLine(codBarras);

    res.send({ linhaDigitavel });
});

export default router;
