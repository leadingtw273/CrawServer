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
    public have_Re?: boolean;
    public title?: string[];
    public not_have?: string[];
    public or_have?: string[];
    private regExp: RegExp;

    constructor(opt: MatchParam = {}) {
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
        if (this.title == null) return '.*';
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
    readonly PPT_BASE_URL: string = 'https://www.ptt.cc/bbs/';
    public searchPageLimit: number;
    public searchPostLimit: number;
    public KANBAN_URL?: URL;
    public kanbanPageCount?: number;
    public kanbanPostCount?: number;

    public constructor(pageLimit: number = 50, postLimit: number = 10) {
        this.searchPageLimit = pageLimit;
        this.searchPostLimit = postLimit;
    }

    public async initKanban(kanban: string): Promise<void> {
        const kanbanUrl = new URL(this.PPT_BASE_URL + kanban);
        const { pageCount, postCount }: { pageCount: number; postCount: number } = await this.crawlKanbanDetail(
            kanbanUrl
        );
        this.kanbanPageCount = pageCount;
        this.kanbanPostCount = postCount;
        this.KANBAN_URL = kanbanUrl;
    }

    private async crawlKanbanDetail(kanbanUrl: URL): Promise<{ pageCount: number; postCount: number }> {
        const $: CheerioStatic = await this.requestPageDom(kanbanUrl);
        return {
            pageCount: this.getPageCount($),
            postCount: this.getPostCount($),
        };
    }

    public async searchPost(matchParam?: MatchParam): Promise<SearchPost[]> {
        if (this.KANBAN_URL == null) throw Error('Must initKanban before use.'); // 若事前沒先執行 setup() 則報錯
        if (this.kanbanPageCount == null) throw Error('Must initKanban before use.'); // 若事前沒先執行 setup() 則報錯

        let postList: SearchPost[] = []; // 篩選解果文章
        let nextUrl: URL = this.KANBAN_URL; // 下一個頁面 URL

        // 若有關鍵字，則實體化關鍵字篩選類別
        const KWregx: KeyWordRegx = new KeyWordRegx(matchParam);

        // 持續取得文章，直到大於等於 postLimit
        for (let prevPage = 1; postList.length < this.searchPostLimit && prevPage <= this.searchPageLimit; prevPage++) {
            // 取得頁面 Dom
            const $: CheerioStatic = await this.requestPageDom(nextUrl);

            // 進行篩選
            const list = $(PTT_DOM.POST_LIST)
                .map((i: number, ele: CheerioElement) => {
                    // 從 Dom 中爬取特定資料
                    const post: SearchPost = this.crawlDataFromDom($(ele));
                    // 若該文章被刪除，則無法取得資料
                    if (post.title === '') return null;
                    // 若無關鍵字，則直接回傳資料
                    if (matchParam == null) return post;
                    // 進行關鍵字篩選(正則)
                    const { pass, keyWord }: { pass: boolean; keyWord: string[] } = KWregx.filter(post.title);
                    return pass ? { ...post, keyWord } : null;
                })
                .get();

            // 取得預爬取下個頁面的 URL
            const nextPath: string = `${this.KANBAN_URL.pathname}/index${this.kanbanPageCount - prevPage}.html`;
            nextUrl = new URL(nextPath, this.KANBAN_URL.toString());

            // 蒐集篩選解果
            postList = postList.concat(list);
        }

        // 進行文章排序，陣列 0 ~ n => 新 ~ 舊，並刪除最舊文章，直到等於 count 數量
        postList = postList
            .sort((a: { date: number }, b: { date: number }) => b.date - a.date)
            .filter((val, i) => i < this.searchPostLimit);

        return postList;
    }

    private crawlDataFromDom($: Cheerio): SearchPost {
        // 擷取標題
        const title: string = $.children('a').text();

        // 擷取刊登時間(TimeStamp)
        const regexDate: RegExp = new RegExp(/\.(\d{10,})\./);
        regexDate.test($.children('a').attr('href'));
        const date: number = Number(RegExp.$1);

        // 擷取網址
        const newUrl: URL = new URL($.children('a').attr('href'), this.PPT_BASE_URL);
        const url: string = newUrl.toString();

        // 擷取留言數量
        const commentsString: string = $.prev('.nrec').text();
        const regexComments: RegExp = new RegExp(/\d+/);
        const isNumber: boolean = regexComments.test(commentsString);
        const comments: number | string = isNumber ? Number(commentsString) : commentsString === '' ? 0 : 'max';

        return { title, date, url, comments };
    }

    private async requestPageDom(url: URL): Promise<CheerioStatic> {
        try {
            return await request({
                uri: url.href,
                headers: {
                    Cookie: 'over18=1',
                },
                transform(body: string) {
                    return cheerio.load(body);
                },
            });
        } catch (err) {
            throw err;
        }
    }

    private getPageCount($: CheerioStatic): number {
        const regex: RegExp = new RegExp(/index(\d+)\.html$/);
        const fileName: string = $(PTT_DOM.PREVIOUS_PAGE_BTN).attr('href');
        regex.test(fileName);

        if (RegExp.$1 == null) throw Error("Can't get page index.");
        return Number(RegExp.$1) + 1;
    }

    private getPostCount($: CheerioStatic): number {
        if (this.kanbanPageCount == null) this.kanbanPageCount = this.getPageCount($);
        return $(PTT_DOM.POST_LIST).length + this.kanbanPageCount * 20;
    }
}

export { PTT, MatchParam, SearchPost };
