import express, { Express, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';

import router from './src/routes/router';

const app: Express = express();
const corsOrigin = process.env.CORS_ORIGIN ?? '*';

app.use(cors({ origin: corsOrigin }));
app.use(helmet());
app.use(express.json());
app.use(morgan('dev'));

app.use('/', router);

app.get('/', (req: Request, res: Response) => {
    console.log(
        `Body: ${JSON.stringify(req.body)}\nParams: ${JSON.stringify(
            req.params,
        )}\nQuery params: ${JSON.stringify(req.query)}`,
    );

    const newObj = {
        hello: 'world',
        number: 20,
        somethingElse: {
            more: false,
        },
    };

    res.send(newObj);
});

export default app;
