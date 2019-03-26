"use strict";
// import * as Koa from 'koa';
// import * as Router from 'koa-router';
Object.defineProperty(exports, "__esModule", { value: true });
// const app = new Koa();
// const router = new Router();
// router.get('/*', async ctx => {
//     ctx.body = 'Hello World!';
// });
// app.use(router.routes());
// app.listen(3000);
// console.log('Server running on port 3000');
const PTT_1 = require("./lib/PTT");
const ptt = new PTT_1.default('CodeJob');
ptt.test();
