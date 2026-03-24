import fs from 'fs';
import path from 'path';
import { createObjectCsvWriter } from 'csv-writer';

import { JobAnalyzed } from './types';

const ANALYZED_JOBS_FILE = path.join(__dirname, '..', 'jobs_analyzed.json');
const OUTPUT_CSV_FILE = path.join(__dirname, '..', 'jobs_ranked.csv');

async function main() {
    console.log('Starting Export process...');

    if (!fs.existsSync(ANALYZED_JOBS_FILE)) {
        console.error('Missing jobs_analyzed.json. Run analyze first: npm run analyze');
        process.exit(1);
    }

    const analyzedJobs: JobAnalyzed[] = JSON.parse(fs.readFileSync(ANALYZED_JOBS_FILE, 'utf-8'));

    if (analyzedJobs.length === 0) {
        console.log('No analyzed jobs found to export.');
        process.exit(0);
    }

    const csvWriter = createObjectCsvWriter({
        path: OUTPUT_CSV_FILE,
        header: [
            { id: 'source', title: 'Source' },
            { id: 'job_category', title: 'Category' },
            { id: 'title', title: 'Job Title' },
            { id: 'automation_potential', title: 'Automation Potential' },
            { id: 'implementation_complexity', title: 'Implementation Complexity' },
            { id: 'sale_potential', title: 'Sale Potential' },
            { id: 'automatable_tasks', title: 'Automatable Tasks' },
            { id: 'confidence', title: 'Confidence' },
            { id: 'url', title: 'URL' },
        ]
    });

    await csvWriter.writeRecords(analyzedJobs.map(job => ({
        ...job,
        automatable_tasks: job.automatable_tasks.join('; '),
    })));
    console.log(`Exported ${analyzedJobs.length} records to ${OUTPUT_CSV_FILE}`);
}

main().catch(err => {
    console.error('Fatal Error:', err);
    process.exit(1);
});
