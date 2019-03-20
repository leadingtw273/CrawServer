import * as request from 'request-promise';
import * as cheerio from 'cheerio';
import { URL } from 'url';

class PTT {
    readonly PPT_BASE_URL: string = 'https://www.ptt.cc/bbs/';
    private kanbanName: string;
    private $: any;

    public constructor(kanban: string) {
        this.kanbanName = kanban;
    }

    public async test() {
        const url = new URL(this.PPT_BASE_URL);
        url.pathname += this.kanbanName;

        const options = {
            uri: url.href,
            transform(body: string) {
                return cheerio.load(body);
            },
        };

        try {
            this.$ = await request(options);
            // console.log(dom);
            // $('.r-ent .title > a').each((i: number, ele: string) => {
            //     console.log($(ele).text());
            // });
            console.log(typeof this.$);
            console.log(
                this.$(
                    '#action-bar-container > div > div.btn-group.btn-group-paging > a:nth-child(2)'
                ).attr('href')
            );
        } catch (err) {
            console.log(err);
        }
    }

    public getLastPosts() {}

    public getPostDetail() {}

    public getSearchPost() {}

    private getPageDom() {}

    private getPageCount() {}

    private getPostCount() {}
}

export default PTT;
