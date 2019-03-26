import * as request from 'request-promise';
import * as cheerio from 'cheerio';
import { URL } from 'url';
import { PTT as PTT_DOM } from '../config/domParse';

interface KeyWord {
    title?: string;
    not_have?: string[];
    or_have?: string[];
}

class KeyWordRegx {
    private regExp: RegExp;

    constructor(opt: KeyWord) {
        
    }

    public filter(data: String): Boolean {
        return true;
    }

    private titleSet(title: string) {
        return `.*\\[${title}\\].*`;
    }

    private notHaveSet(notHave: string[]) {
        return notHave.reduce((acc, cur) => acc + (cur ? `(?!.*${cur})` : ''), '');
    }

    private orHaveSet(orHave: string[]) {
        return `(${orHave.join('|')}).*`;
    }
}

class PTT {
    private PTT_URL: URL;
    private pageCount: number | undefined;
    private postCount: number | undefined;

    public constructor(kanban: string) {
        this.PTT_URL = new URL('https://www.ptt.cc/bbs/');
        this.PTT_URL.pathname += kanban;
    }

    public async setup(): Promise<any> {
        try {
            const $: Function = await this.getPageDom(this.PTT_URL);
            this.pageCount = this.getPageCount($);
            this.postCount = this.getPostCount($);
            return $;
        } catch (err) {
            console.log(err);
        }
    }

    public getPostDetail() {}

    public async getSearchPost(dataCount: number, keyWord?: KeyWord) {
        if (this.pageCount == null) throw Error('Must setup before use.');

        let postList: Object[] = [];
        let nextUrl: URL = this.PTT_URL;

        for (let bp = 0; postList.length < dataCount; bp++) {
            const $: Function = await this.getPageDom(nextUrl);
            const list = $(PTT_DOM.POST_LIST)
                .map((i: number, ele: any) => {
                    const title = $(ele).text();

                    const regex = new RegExp(/\.(\d{10,})\./);
                    regex.test($(ele).attr('href'));
                    const date = Number(RegExp.$1);

                    const newUrl = new URL($(ele).attr('href'), this.PTT_URL.toString());
                    const url = newUrl.toString();

                    if (title === '') {
                        return null;
                    } else {
                        return { title, url, date };
                    }
                })
                .get();
            const nextPath = `${this.PTT_URL.pathname}/index${this.pageCount - bp}.html`;
            nextUrl = new URL(nextPath, this.PTT_URL.toString());
            postList = postList.concat(list);
        }

        postList = postList
            .sort((a: { date: number }, b: { date: number }) => b.date - a.date)
            .filter((val, i) => i < dataCount);

        console.log(postList);
        console.log(postList.length);
    }

    private async getPageDom(url: URL): Promise<Function> {
        return await request({
            uri: url.href,
            headers: {
                Cookie: 'over18=1',
            },
            transform(body: string) {
                return cheerio.load(body);
            },
        });
    }

    private getPageCount($: Function): number {
        const regex = new RegExp(/index(\d+)\.html$/);
        const fileName: string = $(PTT_DOM.PREVIOUS_PAGE_BTN).attr('href');
        regex.test(fileName);

        if (RegExp.$1 == null) throw Error("Can't get page index.");
        return Number(RegExp.$1);
    }

    private getPostCount($: Function): number {
        if (this.pageCount == null) this.pageCount = this.getPageCount($);
        return $(PTT_DOM.POST_LIST).length + this.pageCount * 20;
    }
}

export default PTT;
