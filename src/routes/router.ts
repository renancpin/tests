import express from 'express';
import bank from './bank';
import calculos from './calculos';

const testes = express.Router();
testes.use('/bank', bank);
testes.use('/calculos', calculos);

const router = express.Router();
router.use('/testes', testes);

export default router;
