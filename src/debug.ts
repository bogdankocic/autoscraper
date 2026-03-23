import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
    try {
        await page.goto('https://poslovi.infostud.com/oglasi-za-posao/it', { waitUntil: 'domcontentloaded' });
        const links = await page.evaluate(() => Array.from(document.querySelectorAll('a')).map(a => a.href).filter(href => href.length > 5));
        console.log("INFOSTUD LINKS (first 30):", links.slice(0, 30));

        await page.goto('https://www.helloworld.rs/oglasi-za-posao', { waitUntil: 'domcontentloaded' });
        const links2 = await page.evaluate(() => Array.from(document.querySelectorAll('a')).map(a => a.href).filter(href => href.length > 5));
        console.log("HELLOWORLD LINKS (first 30):", links2.slice(0, 30));
    } catch (e) {
        console.error(e);
    }
    await browser.close();
})();
