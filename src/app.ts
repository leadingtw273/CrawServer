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

const opt = {
    have_Re: false,
    title: ['發案', '團體'],
    not_have: ['已徵到', '已過期', '洽談中', '已徵得', '已發案', '已結案', 'asp'],
    or_have: ['node', '爬蟲', 'web', '網頁', '網站'],
};

const ptt = new PTT('CodeJob');
const test = async () => {
    const detail: { posts: number; pages: number } = await ptt.setup();
    const data: any = await ptt.getSearchPost(5, opt);
    console.log(detail);
    console.log(data);
};
test();
