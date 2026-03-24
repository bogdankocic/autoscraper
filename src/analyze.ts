import fs from 'fs';
import path from 'path';
import 'dotenv/config';

import { analyzeJobs } from './analyzer/gemini';
import { JobRaw } from './types';

const RAW_JOBS_FILE = path.join(__dirname, '..', 'jobs_raw.json');
const ANALYZED_JOBS_FILE = path.join(__dirname, '..', 'jobs_analyzed.json');

async function main() {
    console.log('Starting Analyze process...');

    if (!fs.existsSync(RAW_JOBS_FILE)) {
        console.error('Missing jobs_raw.json. Run scrape first: npm run scrape');
        process.exit(1);
    }

    if (!process.env.GEMINI_API_KEY) {
        console.error('Missing GEMINI_API_KEY in .env');
        process.exit(1);
    }

    let allRawJobs: JobRaw[] = JSON.parse(fs.readFileSync(RAW_JOBS_FILE, 'utf-8'));

    const limitArgIndex = process.argv.indexOf('--limit');
    if (limitArgIndex !== -1 && process.argv[limitArgIndex + 1]) {
        const limit = parseInt(process.argv[limitArgIndex + 1], 10);
        if (!isNaN(limit) && limit > 0) {
            allRawJobs = allRawJobs.slice(0, limit);
            console.log(`Limiting analysis to the first ${limit} jobs.`);
        }
    }

    if (allRawJobs.length === 0) {
        console.log('No jobs found to analyze.');
        process.exit(0);
    }

    // Do not clear the file! Read existing URLs for resumption
    let existingUrls = new Set<string>();
    if (fs.existsSync(ANALYZED_JOBS_FILE)) {
        try {
            const raw = fs.readFileSync(ANALYZED_JOBS_FILE, 'utf-8');
            const jobs: { url: string }[] = JSON.parse(raw);
            jobs.forEach(j => existingUrls.add(j.url));
            console.log(`Found ${existingUrls.size} already analyzed jobs. Resuming analysis...`);
        } catch (e) {
            console.error('Failed to parse existing jobs_analyzed.json. Starting fresh.', e);
            existingUrls.clear();
            fs.writeFileSync(ANALYZED_JOBS_FILE, JSON.stringify([], null, 2));
        }
    } else {
        fs.writeFileSync(ANALYZED_JOBS_FILE, JSON.stringify([], null, 2));
    }

    console.log(`Analyzing ${allRawJobs.length} jobs...`);
    await analyzeJobs(allRawJobs, ANALYZED_JOBS_FILE, existingUrls);

    console.log('Analyze complete.');
}

main().catch(err => {
    console.error('Fatal Error:', err);
    process.exit(1);
});
