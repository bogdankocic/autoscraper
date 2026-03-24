import * as cheerio from 'cheerio';

async function getLinks(url: string, selector: string, excludeText: string): Promise<string[]> {
    const res = await fetch(url);
    const html = await res.text();
    const $ = cheerio.load(html);
    const links: string[] = [];
    $('a').each((i, el) => {
        const href = $(el).attr('href');
        if (href && href.includes(selector) && !href.includes(excludeText)) {
            links.push(href);
        }
    });
    return Array.from(new Set(links));
}

async function testPagination() {
    console.log('Testing Infostud...');
    const infoP1 = await getLinks('https://poslovi.infostud.com/poslovi-programiranje-it?page=1', '/poslovi/', 'kategorija');
    const infoP2 = await getLinks('https://poslovi.infostud.com/poslovi-programiranje-it?page=2', '/poslovi/', 'kategorija');
    console.log(`Infostud Page 1: ${infoP1.length} links. Page 2: ${infoP2.length} links.`);
    console.log(`Are they different? ${JSON.stringify(infoP1.slice(0, 3))} vs ${JSON.stringify(infoP2.slice(0, 3))}`);

    console.log('Testing Helloworld...');
    const hwP1 = await getLinks('https://www.helloworld.rs/poslovi-softversko-inzenjerstvo?page=1', '/oglas/', 'oglasi-za-posao');
    const hwP2 = await getLinks('https://www.helloworld.rs/poslovi-softversko-inzenjerstvo?page=2', '/oglas/', 'oglasi-za-posao');
    console.log(`Helloworld Page 1: ${hwP1.length} links. Page 2: ${hwP2.length} links.`);
    console.log(`Are they different? ${JSON.stringify(hwP1.slice(0, 3))} vs ${JSON.stringify(hwP2.slice(0, 3))}`);
}

testPagination().catch(console.error);
