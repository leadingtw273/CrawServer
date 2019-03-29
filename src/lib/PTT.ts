import * as request from 'request-promise';
import * as cheerio from 'cheerio';
import { URL } from 'url';
import { PTT as PTT_DOM } from '../config/domParse';

interface MatchParam {
    have_Re?: boolean;
    title?: string[];
    not_have?: string[];
    or_have?: string[];
}

interface SearchPost {
    title: string;
    url: string;
    date: number;
    comments: string | number;
    keyWord?: string[];
}

class KeyWordRegx implements MatchParam {
    public have_Re: boolean | undefined;
    public title: string[] | undefined;
    public not_have: string[] | undefined;
    public or_have: string[] | undefined;
    private regExp: RegExp;

    constructor(opt: MatchParam) {
        this.have_Re = opt.have_Re;
        this.title = opt.title;
        this.not_have = opt.not_have;
        this.or_have = opt.or_have;

        this.regExp = new RegExp(
            `^${this.getHaveRe()}.*\\[${this.getTitleReg()}\\]${this.getNotHaveReg()}.*${this.getOrHaveReg()}.*`,
            'gi'
        );
    }

    public filter(text: string): { pass: boolean; keyWord: string[] } {
        const pass: boolean = this.regExp.test(text);
        const keyWord: string[] = [];
        if (RegExp.$1 !== '') keyWord.push(RegExp.$1);
        if (RegExp.$2 !== '') keyWord.push(RegExp.$2);
        return {
            pass,
            keyWord,
        };
    }

    private getHaveRe(): string {
        if (this.have_Re == null) return '';
        return this.have_Re ? '' : '(?!Re: )';
    }

    private getTitleReg(): string {
        if (this.title == null) return '';
        return `(${this.title.join('|')})`;
    }

    private getOrHaveReg(): string {
        if (this.or_have == null) return '';
        return `(${this.or_have.join('|')})`;
    }

    private getNotHaveReg(): string {
        if (this.not_have == null) return '';
        return this.not_have.reduce((acc, cur) => acc + (cur ? `(?!.*${cur})` : ''), '');
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

    public async setup(): Promise<void> {
        try {
            const $: CheerioStatic = await this.getPageDom(this.PTT_URL);
            this.pageCount = this.getPageCount($);
            this.postCount = this.getPostCount($);
        } catch (err) {
            console.log(err);
        }
    }

    public getPostDetail() {}

    public async getSearchPost(count: number, opt?: MatchParam): Promise<SearchPost[]> {
        if (this.pageCount == null) throw Error('Must setup before use.'); // 若事前沒先執行 setup() 則報錯

        let postList: SearchPost[] = []; // 篩選解果文章
        let nextUrl: URL = this.PTT_URL; // 下一個頁面 URL

        // 若有關鍵字，則實體化關鍵字篩選類別
        let KWregx: KeyWordRegx;
        if (opt != null) KWregx = new KeyWordRegx(opt);

        // 持續取得文章，直到大於等於 count
        for (let prevPage = 0; postList.length < count; prevPage++) {
            // 取得頁面 Dom
            const $: CheerioStatic = await this.getPageDom(nextUrl);

            // 進行篩選
            const list = $(PTT_DOM.POST_LIST)
                .map((i: number, ele: CheerioElement) => {
                    // 從 Dom 中爬取特定資料
                    const post: SearchPost = this.crawlInfo($(ele));
                    // 若該文章被刪除，則無法取得資料
                    if (post.title === '') return null;
                    // 若無關鍵字，則直接回傳資料
                    if (opt == null) return post;
                    // 進行關鍵字篩選(正則)
                    const { pass, keyWord }: { pass: boolean; keyWord: string[] } = KWregx.filter(post.title);
                    return pass ? { ...post, keyWord } : null;
                })
                .get();

            // 取得預爬取下個頁面的 URL
            const nextPath: string = `${this.PTT_URL.pathname}/index${this.pageCount - prevPage}.html`;
            nextUrl = new URL(nextPath, this.PTT_URL.toString());

            // 蒐集篩選解果
            postList = postList.concat(list);
        }

        // 進行文章排序，陣列 0 ~ n => 新 ~ 舊，並刪除最舊文章，直到等於 count 數量
        postList = postList
            .sort((a: { date: number }, b: { date: number }) => b.date - a.date)
            .filter((val, i) => i < count);

        return postList;
    }

    private crawlInfo($: Cheerio): SearchPost {
        const commentsString: string = $.prev('.nrec').text();
        const regexComments: RegExp = new RegExp(/\d+/);
        const isNumber: boolean = regexComments.test(commentsString);
        const comments: number | string = isNumber ? Number(commentsString) : commentsString === '' ? 0 : 'max';

        const title: string = $.children('a').text();

        const regexDate: RegExp = new RegExp(/\.(\d{10,})\./);
        regexDate.test($.children('a').attr('href'));
        const date: number = Number(RegExp.$1);

        const newUrl: URL = new URL($.children('a').attr('href'), this.PTT_URL.toString());
        const url: string = newUrl.toString();

        return { title, date, url, comments };
    }

    private async getPageDom(url: URL): Promise<CheerioStatic> {
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

    private getPageCount($: CheerioStatic): number {
        const regex: RegExp = new RegExp(/index(\d+)\.html$/);
        const fileName: string = $(PTT_DOM.PREVIOUS_PAGE_BTN).attr('href');
        regex.test(fileName);

        if (RegExp.$1 == null) throw Error("Can't get page index.");
        return Number(RegExp.$1);
    }

    private getPostCount($: CheerioStatic): number {
        if (this.pageCount == null) this.pageCount = this.getPageCount($);
        return $(PTT_DOM.POST_LIST).length + this.pageCount * 20;
    }
}

export default PTT;
