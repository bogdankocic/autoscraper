import puppeteer, { Page, Browser } from 'puppeteer';
import { JobRaw } from '../types';

export async function scrapeInfostud(categories: string[]): Promise<JobRaw[]> {
  const browser = await puppeteer.launch({ headless: true });
  const allJobs: JobRaw[] = [];

  try {
    for (const categoryUrl of categories) {
      let pageNumber = 1;
      let previousLinks: string[] = [];
      let allCategoryJobLinks: string[] = [];

      while (true) {
        const separator = categoryUrl.includes('?') ? '&' : '?';
        const paginatedUrl = `${categoryUrl}${separator}page=${pageNumber}`;

        console.log(`Scraping Infostud category page ${pageNumber}: ${paginatedUrl}`);
        const page = await browser.newPage();
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
        try {
          await page.goto(paginatedUrl, { waitUntil: 'networkidle2', timeout: 60000 });
        } catch (e) {
          console.error(`Failed to navigate to ${paginatedUrl}:`, e);
          await page.close();
          break;
        }

        const jobLinks = await page.evaluate(() => {
          const anchors = Array.from(document.querySelectorAll('a'));
          return anchors
            .map(a => a.href)
            .filter(href => href.includes('/poslovi/') || href.includes('/posao/')) // Basic filter
            .filter(href => !href.includes('/poslovi-') && !href.includes('kategorija')) // Exclude another categories
            .filter((value, index, self) => self.indexOf(value) === index); // Deduplicate
        });

        await page.close();

        if (jobLinks.length === 0) {
          break;
        }

        const isSameAsPrevious = jobLinks.length === previousLinks.length && jobLinks.every((link, index) => link === previousLinks[index]);
        if (isSameAsPrevious) {
          break;
        }

        allCategoryJobLinks.push(...jobLinks);
        previousLinks = jobLinks;
        pageNumber++;
      }

      const uniqueJobLinks = Array.from(new Set(allCategoryJobLinks));
      console.log(`Found ${uniqueJobLinks.length} total job links in ${categoryUrl}`);

      for (const link of uniqueJobLinks) {
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
    }
  } finally {
    await browser.close();
  }

  return allJobs;
}
