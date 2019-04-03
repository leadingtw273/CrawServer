"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const Router = require("koa-router");
const PTT_1 = require("../lib/PTT");
const router = new Router();
const ptt = new PTT_1.PTT();
router
    .use('/crawl/:kanban', (ctx, next) => __awaiter(this, void 0, void 0, function* () {
    const searchParam = {};
    const { title, have_Re, or_have, not_have } = ctx.query;
    if (title != null && title != '') {
        searchParam.title = title.split(',').map((ele) => ele.trim());
    }
    if (have_Re != null && have_Re != '') {
        searchParam.have_Re = have_Re === 'true' ? true : false;
    }
    if (or_have != null && or_have != '') {
        searchParam.or_have = or_have.split(',').map((ele) => ele.trim());
    }
    if (not_have != null && not_have != '') {
        searchParam.not_have = not_have.split(',').map((ele) => ele.trim());
    }
    try {
        const kanbanDetail = yield ptt.setup(ctx.params.kanban);
        ctx.kanban = ctx.params.kanban;
        ctx.searchParam = Object.keys(searchParam).length > 0 ? searchParam : undefined;
        ctx.kanbanDetail = kanbanDetail;
        yield next();
    }
    catch (error) {
        console.log('use => ', error);
    }
}))
    .get('/crawl/:kanban', (ctx) => __awaiter(this, void 0, void 0, function* () {
    try {
        const data = yield ptt.getSearchPost(ctx.searchParam);
        console.log(data);
        ctx.body = data;
    }
    catch (error) {
        console.log('get: /:kanban => ', error);
    }
}))
    .post('/setting', (ctx) => __awaiter(this, void 0, void 0, function* () {
    const { pageLimit, postLimit } = ctx.request.body;
    if (postLimit != null)
        ptt.postLimit = postLimit;
    if (pageLimit != null)
        ptt.pageLimit = pageLimit;
    ctx.body = 'ok';
}));
exports.default = router;
