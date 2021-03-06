import * as Router from 'koa-router';
import { PTT, MatchParam, SearchPost } from '../lib/PTT';

const router: Router = new Router();
const ptt: PTT = new PTT();

interface UrlParam {
    title?: string;
    have_Re?: string;
    or_have?: string;
    not_have?: string;
}

router
    .use('/crawl/:kanban', async (ctx, next) => {
        const searchParam: MatchParam = {};
        const { title, have_Re, or_have, not_have }: UrlParam = ctx.query;

        if (title != null && title != '') {
            searchParam.title = title.split(',').map((ele: string) => ele.trim());
        }
        if (have_Re != null && have_Re != '') {
            searchParam.have_Re = have_Re === 'true' ? true : false;
        }
        if (or_have != null && or_have != '') {
            searchParam.or_have = or_have.split(',').map((ele: string) => ele.trim());
        }
        if (not_have != null && not_have != '') {
            searchParam.not_have = not_have.split(',').map((ele: string) => ele.trim());
        }

        try {
            await ptt.initKanban(ctx.params.kanban);
            ctx.kanban = ctx.params.kanban;
            ctx.searchParam = Object.keys(searchParam).length > 0 ? searchParam : undefined;
            ctx.kanbanDetail = {
                pageCount: ptt.kanbanPageCount,
                postCount: ptt.kanbanPostCount,
            };
            await next();
        } catch (error) {
            console.log('use => ', error);
        }
    })
    .get('/crawl/:kanban', async ctx => {
        try {
            const data: SearchPost[] = await ptt.searchPost(ctx.searchParam);
            console.log(data);
            ctx.body = data;
        } catch (error) {
            console.log('get: /:kanban => ', error);
        }
    })
    .get('/crawl/:kanban/detail', async ctx => {
        ctx.body = ctx.kanbanDetail;
    })
    .post('/setting', async ctx => {
        const { pageLimit, postLimit }: { pageLimit: number; postLimit: number } = ctx.request.body;
        if (postLimit != null) ptt.searchPostLimit = postLimit;
        if (pageLimit != null) ptt.searchPageLimit = pageLimit;
        ctx.body = 'ok';
    });

export default router;
