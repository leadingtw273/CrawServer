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
const request = require("request-promise");
const cheerio = require("cheerio");
const url_1 = require("url");
const domParse_1 = require("../config/domParse");
class KeyWordRegx {
    constructor(opt = {}) {
        this.have_Re = opt.have_Re;
        this.title = opt.title;
        this.not_have = opt.not_have;
        this.or_have = opt.or_have;
        this.regExp = new RegExp(`^${this.getHaveRe()}.*\\[${this.getTitleReg()}\\]${this.getNotHaveReg()}.*${this.getOrHaveReg()}.*`, 'gi');
    }
    filter(text) {
        const pass = this.regExp.test(text);
        const keyWord = [];
        if (RegExp.$1 !== '')
            keyWord.push(RegExp.$1);
        if (RegExp.$2 !== '')
            keyWord.push(RegExp.$2);
        return {
            pass,
            keyWord,
        };
    }
    getHaveRe() {
        if (this.have_Re == null)
            return '';
        return this.have_Re ? '' : '(?!Re: )';
    }
    getTitleReg() {
        if (this.title == null)
            return '.*';
        return `(${this.title.join('|')})`;
    }
    getOrHaveReg() {
        if (this.or_have == null)
            return '';
        return `(${this.or_have.join('|')})`;
    }
    getNotHaveReg() {
        if (this.not_have == null)
            return '';
        return this.not_have.reduce((acc, cur) => acc + (cur ? `(?!.*${cur})` : ''), '');
    }
}
class PTT {
    constructor(pageLimit = 50, postLimit = 10) {
        this.PPT_BASE_URL = 'https://www.ptt.cc/bbs/';
        this.searchPageLimit = pageLimit;
        this.searchPostLimit = postLimit;
    }
    initKanban(kanban) {
        return __awaiter(this, void 0, void 0, function* () {
            const kanbanUrl = new url_1.URL(this.PPT_BASE_URL + kanban);
            const { pageCount, postCount } = yield this.crawlKanbanDetail(kanbanUrl);
            this.kanbanPageCount = pageCount;
            this.kanbanPostCount = postCount;
            this.KANBAN_URL = kanbanUrl;
        });
    }
    crawlKanbanDetail(kanbanUrl) {
        return __awaiter(this, void 0, void 0, function* () {
            const $ = yield this.requestPageDom(kanbanUrl);
            return {
                pageCount: this.getPageCount($),
                postCount: this.getPostCount($),
            };
        });
    }
    searchPost(matchParam) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.KANBAN_URL == null)
                throw Error('Must initKanban before use.'); // 若事前沒先執行 setup() 則報錯
            if (this.kanbanPageCount == null)
                throw Error('Must initKanban before use.'); // 若事前沒先執行 setup() 則報錯
            let postList = []; // 篩選解果文章
            let nextUrl = this.KANBAN_URL; // 下一個頁面 URL
            // 若有關鍵字，則實體化關鍵字篩選類別
            const KWregx = new KeyWordRegx(matchParam);
            // 持續取得文章，直到大於等於 postLimit
            for (let prevPage = 1; postList.length < this.searchPostLimit && prevPage <= this.searchPageLimit; prevPage++) {
                // 取得頁面 Dom
                const $ = yield this.requestPageDom(nextUrl);
                // 進行篩選
                const list = $(domParse_1.PTT.POST_LIST)
                    .map((i, ele) => {
                    // 從 Dom 中爬取特定資料
                    const post = this.crawlDataFromDom($(ele));
                    // 若該文章被刪除，則無法取得資料
                    if (post.title === '')
                        return null;
                    // 若無關鍵字，則直接回傳資料
                    if (matchParam == null)
                        return post;
                    // 進行關鍵字篩選(正則)
                    const { pass, keyWord } = KWregx.filter(post.title);
                    return pass ? Object.assign({}, post, { keyWord }) : null;
                })
                    .get();
                // 取得預爬取下個頁面的 URL
                const nextPath = `${this.KANBAN_URL.pathname}/index${this.kanbanPageCount - prevPage}.html`;
                nextUrl = new url_1.URL(nextPath, this.KANBAN_URL.toString());
                // 蒐集篩選解果
                postList = postList.concat(list);
            }
            // 進行文章排序，陣列 0 ~ n => 新 ~ 舊，並刪除最舊文章，直到等於 count 數量
            postList = postList
                .sort((a, b) => b.date - a.date)
                .filter((val, i) => i < this.searchPostLimit);
            return postList;
        });
    }
    crawlDataFromDom($) {
        // 擷取標題
        const title = $.children('a').text();
        // 擷取刊登時間(TimeStamp)
        const regexDate = new RegExp(/\.(\d{10,})\./);
        regexDate.test($.children('a').attr('href'));
        const date = Number(RegExp.$1);
        // 擷取網址
        const newUrl = new url_1.URL($.children('a').attr('href'), this.PPT_BASE_URL);
        const url = newUrl.toString();
        // 擷取留言數量
        const commentsString = $.prev('.nrec').text();
        const regexComments = new RegExp(/\d+/);
        const isNumber = regexComments.test(commentsString);
        const comments = isNumber ? Number(commentsString) : commentsString === '' ? 0 : 'max';
        return { title, date, url, comments };
    }
    requestPageDom(url) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                return yield request({
                    uri: url.href,
                    headers: {
                        Cookie: 'over18=1',
                    },
                    transform(body) {
                        return cheerio.load(body);
                    },
                });
            }
            catch (err) {
                throw err;
            }
        });
    }
    getPageCount($) {
        const regex = new RegExp(/index(\d+)\.html$/);
        const fileName = $(domParse_1.PTT.PREVIOUS_PAGE_BTN).attr('href');
        regex.test(fileName);
        if (RegExp.$1 == null)
            throw Error("Can't get page index.");
        return Number(RegExp.$1) + 1;
    }
    getPostCount($) {
        if (this.kanbanPageCount == null)
            this.kanbanPageCount = this.getPageCount($);
        return $(domParse_1.PTT.POST_LIST).length + this.kanbanPageCount * 20;
    }
}
exports.PTT = PTT;
