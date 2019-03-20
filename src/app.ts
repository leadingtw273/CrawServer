// import * as Koa from 'koa';
// import * as Router from 'koa-router';

// const app = new Koa();
// const router = new Router();

// router.get('/*', async ctx => {
//     ctx.body = 'Hello World!';
// });

// app.use(router.routes());

// app.listen(3000);

// console.log('Server running on port 3000');

import PTT from './lib/PTT';

const ptt = new PTT('CodeJob');
ptt.test();
