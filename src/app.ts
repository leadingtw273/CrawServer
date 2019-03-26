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
    REGEXP: {
        title: '發案',
        not_have: ['已徵到', '已過期', '洽談中', '已結案', '已徵得', '已解決'],
        or_have: ['node', '網頁', '爬蟲'],
    },
    DATA_COUNT: 5,
};

const ptt = new PTT('CodeJob');
const test = async () => {
    await ptt.setup();
    await ptt.getSearchPost(84);
};
test();
