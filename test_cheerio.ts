import * as cheerio from 'cheerio';

async function testPagination() {
    console.log('Checking Infostud...');
    const infoRes = await fetch('https://poslovi.infostud.com/poslovi-programiranje-it');
    const infoHtml = await infoRes.text();
    const $info = cheerio.load(infoHtml);
    const infoLinks: string[] = [];
    $info('a').each((i, el) => {
        const href = $info(el).attr('href');
        if (href && (href.includes('page=') || href.includes('strana='))) {
            infoLinks.push(href);
        }
    });
    console.log('Infostud Pagination Links:', Array.from(new Set(infoLinks)));

    console.log('Checking Helloworld...');
    const hwRes = await fetch('https://www.helloworld.rs/poslovi-softversko-inzenjerstvo');
    const hwHtml = await hwRes.text();
    const $hw = cheerio.load(hwHtml);
    const hwLinks: string[] = [];
    $hw('a').each((i, el) => {
        const href = $hw(el).attr('href');
        if (href && (href.includes('page=') || href.includes('strana='))) {
            hwLinks.push(href);
        }
    });
    console.log('Helloworld Pagination Links:', Array.from(new Set(hwLinks)));
}

testPagination().catch(console.error);
