import express from 'express';
import bank from './bank';

const router = express.Router();

router.use('/bank', bank);

export default router;
