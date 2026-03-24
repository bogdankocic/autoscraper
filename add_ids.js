const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'jobs_raw.json');
const rawData = fs.readFileSync(filePath, 'utf-8');
const jobs = JSON.parse(rawData);

jobs.forEach((job, index) => {
    // Add id as the first property if possible, or just assign it
    // To ensure it shows up early when inspecting, we could recreate the object,
    // but simply adding the property is fine for JSON.
    job.id = index + 1;
});

// Reorder object so that 'id' is at the top of each item
const updatedJobs = jobs.map(job => {
    const { id, ...rest } = job;
    return { id, ...rest };
});

fs.writeFileSync(filePath, JSON.stringify(updatedJobs, null, 2));

console.log(`Added incremental IDs to ${updatedJobs.length} items in jobs_raw.json`);
