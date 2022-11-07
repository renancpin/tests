import express, { Request, Response } from 'express';
import {
    parseBarCode,
    parseDigitableLine,
} from '../modules/calculos/calculos.service';

const router = express.Router();

router.get('/cod-barras/:input', (req: Request, res: Response) => {
    const input = req.params.input;

    const codBarras = parseBarCode(input);
    const linhaDigitavel = parseDigitableLine(input);

    res.send({ codBarras, linhaDigitavel });
});

export default router;
