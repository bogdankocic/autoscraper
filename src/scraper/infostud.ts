import puppeteer, { Page, Browser } from 'puppeteer';
import { JobRaw } from '../types';

export async function scrapeInfostud(categories: string[]): Promise<JobRaw[]> {
  const browser = await puppeteer.launch({ headless: true });
  const allJobs: JobRaw[] = [];

  try {
    for (const categoryUrl of categories) {
      console.log(`Scraping Infostud category: ${categoryUrl}`);
      const page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
      await page.goto(categoryUrl, { waitUntil: 'networkidle2', timeout: 60000 });

      // Find all job links on the category page
      const jobLinks = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('a'));
        return anchors
          .map(a => a.href)
          .filter(href => href.includes('/poslovi/') || href.includes('/posao/')) // Basic filter
          .filter(href => !href.includes('/poslovi-') && !href.includes('kategorija')) // Exclude another categories
          .filter((value, index, self) => self.indexOf(value) === index); // Deduplicate
      });

      console.log(`Found ${jobLinks.length} potential job links in ${categoryUrl}`);

      // We should limit scraping to max jobs per category initially to avoid huge load
      const limit = process.env.MAX_JOBS ? parseInt(process.env.MAX_JOBS) : 10;
      const linksToScrape = jobLinks.slice(0, limit);

      for (const link of linksToScrape) {
        console.log(`Scraping Infostud job: ${link}`);
        try {
          const detailPage = await browser.newPage();
          await detailPage.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
          await detailPage.goto(link, { waitUntil: 'domcontentloaded', timeout: 30000 });
          
          const jobData = await detailPage.evaluate(() => {
            const title = (document.querySelector('h1') as HTMLElement)?.innerText || document.title;
            const descriptionContainer = (document.querySelector('.job__desc') || document.querySelector('.uk-container') || document.body) as HTMLElement;
            const description = descriptionContainer.innerText;
            
            return { title, description };
          });

          allJobs.push({
            url: link,
            source: 'infostud',
            category_url: categoryUrl,
            title: jobData.title.trim(),
            description: jobData.description.trim().substring(0, 15000), // Limit length for LLM
          });

          await detailPage.close();
        } catch (err) {
          console.error(`Failed to scrape ${link}:`, err);
        }
      }
      await page.close();
    }
  } finally {
    await browser.close();
  }

  return allJobs;
}
