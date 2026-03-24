import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    console.log('Checking Infostud...');
    await page.goto('https://poslovi.infostud.com/poslovi-programiranje-it', { waitUntil: 'domcontentloaded' });
    const infostudLinks = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a')).map(a => a.href).filter(h => h.includes('page') || h.includes('stran'));
    });
    console.log('Infostud Pagination Links:', Array.from(new Set(infostudLinks)));

    console.log('Checking Helloworld...');
    await page.goto('https://www.helloworld.rs/poslovi-softversko-inzenjerstvo', { waitUntil: 'domcontentloaded' });
    const hwLinks = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('a')).map(a => a.href).filter(h => h.includes('page') || h.includes('stran'));
    });
    console.log('Helloworld Pagination Links:', Array.from(new Set(hwLinks)));

    await browser.close();
})();
