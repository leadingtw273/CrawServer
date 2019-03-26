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
class PTT {
    constructor(kanban) {
        this.PPT_BASE_URL = 'https://www.ptt.cc/bbs/';
        this.kanbanName = kanban;
    }
    test() {
        return __awaiter(this, void 0, void 0, function* () {
            const url = new url_1.URL(this.PPT_BASE_URL);
            url.pathname += this.kanbanName;
            const options = {
                uri: url.href,
                transform(body) {
                    return cheerio.load(body);
                },
            };
            try {
                this.$ = yield request(options);
                // console.log(dom);
                // $('.r-ent .title > a').each((i: number, ele: string) => {
                //     console.log($(ele).text());
                // });
                console.log(typeof this.$);
                console.log(this.$('#action-bar-container > div > div.btn-group.btn-group-paging > a:nth-child(2)').attr('href'));
            }
            catch (err) {
                console.log(err);
            }
        });
    }
    getLastPosts() { }
    getPostDetail() { }
    getSearchPost() { }
    getPageDom() { }
    getPageCount() { }
    getPostCount() { }
}
exports.default = PTT;
