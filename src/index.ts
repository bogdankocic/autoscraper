import fs from 'fs';
import path from 'path';
import 'dotenv/config';
import { createObjectCsvWriter } from 'csv-writer';

import { scrapeInfostud } from './scraper/infostud';
import { scrapeHelloworld } from './scraper/helloworld';
import { analyzeJobs } from './analyzer/gemini';
import { JobRaw, JobAnalyzed } from './types';

interface Config {
  infostud?: string[];
  helloworld?: string[];
}

const RAW_JOBS_FILE = path.join(__dirname, '..', 'jobs_raw.json');
const ANALYZED_JOBS_FILE = path.join(__dirname, '..', 'jobs_analyzed.json');
const OUTPUT_CSV_FILE = path.join(__dirname, '..', 'jobs_ranked.csv');

async function main() {
  console.log('Starting Autoscraper process...');
  
  const categoriesFile = path.join(__dirname, '..', 'categories.json');
  if (!fs.existsSync(categoriesFile)) {
    console.error('Missing categories.json, please provide it!');
    process.exit(1);
  }

  const config: Config = JSON.parse(fs.readFileSync(categoriesFile, 'utf-8'));
  let allRawJobs: JobRaw[] = [];

  // Stage 1: Scraping (or loading from cache)
  if (fs.existsSync(RAW_JOBS_FILE) && !process.env.FORCE_SCRAPE) {
    console.log('Found jobs_raw.json. Loading from cache. Set FORCE_SCRAPE=1 to re-scrape.');
    allRawJobs = JSON.parse(fs.readFileSync(RAW_JOBS_FILE, 'utf-8'));
  } else {
    console.log('Scraping Phase...');
    if (config.infostud && config.infostud.length > 0) {
      const infostudJobs = await scrapeInfostud(config.infostud);
      allRawJobs.push(...infostudJobs);
    }

    if (config.helloworld && config.helloworld.length > 0) {
      const hwJobs = await scrapeHelloworld(config.helloworld);
      allRawJobs.push(...hwJobs);
    }

    fs.writeFileSync(RAW_JOBS_FILE, JSON.stringify(allRawJobs, null, 2));
    console.log(`Saved ${allRawJobs.length} raw jobs to jobs_raw.json`);
  }

  if (allRawJobs.length === 0) {
    console.log('No jobs found to analyze.');
    process.exit(0);
  }

  // Stage 2: AI Analysis
  console.log('AI Analysis Phase...');
  if (!process.env.GEMINI_API_KEY) {
      console.warn("Skipping AI analysis because GEMINI_API_KEY is missing in .env");
      process.exit(0);
  }

  const analyzedJobs = await analyzeJobs(allRawJobs);
  
  fs.writeFileSync(ANALYZED_JOBS_FILE, JSON.stringify(analyzedJobs, null, 2));
  console.log(`Saved ${analyzedJobs.length} analyzed jobs to jobs_analyzed.json`);

  // Stage 3: CSV Export
  if (analyzedJobs.length > 0) {
    const csvWriter = createObjectCsvWriter({
      path: OUTPUT_CSV_FILE,
      header: [
        { id: 'source', title: 'Source' },
        { id: 'job_category', title: 'Category' },
        { id: 'title', title: 'Job Title' },
        { id: 'is_automatable', title: 'Is Automatable' },
        { id: 'complexity', title: 'Complexity' },
        { id: 'sale_potential', title: 'Sale Potential' },
        { id: 'what_is_automatable', title: 'What is Automatable' },
        { id: 'url', title: 'URL' },
      ]
    });

    await csvWriter.writeRecords(analyzedJobs);
    console.log(`Exported records to ${OUTPUT_CSV_FILE}`);
  }

  console.log('Autoscraper completed successfully.');
}

main().catch(err => {
  console.error('Fatal Error:', err);
  process.exit(1);
});
