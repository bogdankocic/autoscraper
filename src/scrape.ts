import fs from 'fs';
import path from 'path';
import 'dotenv/config';

import { scrapeInfostud } from './scraper/infostud';
import { scrapeHelloworld } from './scraper/helloworld';

interface Config {
    infostud?: string[];
    helloworld?: string[];
}

const RAW_JOBS_FILE = path.join(__dirname, '..', 'jobs_raw.json');

async function main() {
    console.log('Starting Scrape process...');

    const categoriesFile = path.join(__dirname, '..', 'categories.json');
    if (!fs.existsSync(categoriesFile)) {
        console.error('Missing categories.json, please provide it!');
        process.exit(1);
    }

    const config: Config = JSON.parse(fs.readFileSync(categoriesFile, 'utf-8'));

    // Do not clear the file! Read existing URLs for resumption
    let existingUrls = new Set<string>();
    if (fs.existsSync(RAW_JOBS_FILE)) {
        try {
            const raw = fs.readFileSync(RAW_JOBS_FILE, 'utf-8');
            const jobs: { url: string }[] = JSON.parse(raw);
            jobs.forEach(j => existingUrls.add(j.url));
            console.log(`Found ${existingUrls.size} existing jobs. Resuming scrape...`);
        } catch (e) {
            console.error('Failed to parse existing jobs_raw.json. Starting fresh.', e);
            existingUrls.clear();
            fs.writeFileSync(RAW_JOBS_FILE, JSON.stringify([], null, 2));
        }
    } else {
        fs.writeFileSync(RAW_JOBS_FILE, JSON.stringify([], null, 2));
    }

    let totalJobs = 0;

    if (config.infostud && config.infostud.length > 0) {
        const infostudJobs = await scrapeInfostud(config.infostud, RAW_JOBS_FILE, existingUrls);
        totalJobs += infostudJobs;
    }

    if (config.helloworld && config.helloworld.length > 0) {
        const hwJobs = await scrapeHelloworld(config.helloworld, RAW_JOBS_FILE, existingUrls);
        totalJobs += hwJobs;
    }

    console.log(`Scrape complete. Total jobs saved: ${totalJobs}`);
}

main().catch(err => {
    console.error('Fatal Error:', err);
    process.exit(1);
});
