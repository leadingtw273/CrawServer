import * as Koa from 'koa';
import * as Router from 'koa-router';
import * as logger from 'koa-logger';
import * as bodyParser from 'koa-bodyparser';

import ptt from './routes/ptt';

const app: Koa = new Koa();
const router: Router = new Router();

app.use(bodyParser({ jsonLimit: '1kb' }));
app.use(logger());

router.use('/ptt', ptt.routes());

app.use(router.routes());
app.use(router.allowedMethods());

app.listen(3000);

console.log('Server running on port 3000');
