import 'reflect-metadata';
import * as express from 'express';
import * as logger from 'morgan';
import { router } from './router';
import { createConnection } from './db';

const app = express();

app.use(logger('tiny'));

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.use('/', router);

(async () => {
    const port = process.env.PORT || 12180;
    await createConnection();
    app.listen(port);
    console.log('Listening on port', port);
})().catch(e => console.error(e.stack));