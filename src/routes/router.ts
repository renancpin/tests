import express from 'express';
import testes from './testes';

const router = express.Router();

router.use('/testes', testes);

export default router;
