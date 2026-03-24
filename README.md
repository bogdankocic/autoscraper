# Autoscraper

An automated web crawler and AI-driven analysis tool that extracts job listings from Serbian job boards (Infostud, Helloworld) and utilizes Google's Gemini AI to evaluate, score, and rank the feasibility of automating those roles. 

## How It Works

The execution is split into 3 distinct stages:
1. **Scraping Phase:** Puppeteer-powered headless browsers crawl designated category URLs across all available pagination results, extracting raw job details (title, description, and source). The output is cached in `jobs_raw.json`.
2. **AI Analysis Phase:** The `jobs_raw.json` cache is read and piped through Gemini's LLM. Gemini evaluates complexity and automation potential, outputting the structured results to `jobs_analyzed.json`.
3. **CSV Export:** The structured data is ultimately flattened and exported as `jobs_ranked.csv` for easy viewing in Excel or Google Sheets.

By default, **if `jobs_raw.json` already exists, the script intelligently skips Phase 1 (Scraping)** and jumps straight into analyzing the cached data.

---

## Configuration

### 1. `.env` File
Create a `.env` file in the root of the project. You must supply your Gemini API key:
```env
GEMINI_API_KEY="your_google_gemini_api_key_here"
```

### 2. `categories.json`
Define the target category URLs for the scraping engines. The script will automatically loop through the pages of any URL provided here:

```json
{
  "infostud": [
    "https://poslovi.infostud.com/oglasi-za-posao-it"
  ],
  "helloworld": [
    "https://www.helloworld.rs/oglasi-za-posao/programiranje"
  ]
}
```

---

## Running with Docker (Recommended)

To avoid missing shared libraries and complex local system dependencies for Chrome/Puppeteer, executing the script via Docker Compose is highly recommended. 

The `docker-compose.yml` mounts your current directory so the JSON and CSV output files are instantly saved directly to your host machine.

### 1. Boot up the Background Service
Start the Docker container as a background daemon. It won't scrape automatically, it will just idle until you send it execution commands.
```bash
docker compose up -d --build
```

### 2. Trigger a Fresh Scrape
To force the crawler to visit the sites and pull the newest jobs (ignoring and overwriting any existing cache), pass the `FORCE_SCRAPE=1` environment variable to the execution command:
```bash
docker compose exec -e FORCE_SCRAPE=1 scraper npx ts-node src/index.ts
```

### 3. Run Only the AI Analyzer (on existing data)
If `jobs_raw.json` is already populated on your machine, you can run the scanner without re-scraping the web. By omitting the `FORCE_SCRAPE` variable, the exact same command skips to the analyzer phase:
```bash
docker compose exec scraper npx ts-node src/index.ts
```

## Troubleshooting

- **Puppeteer Failing to Launch (Locally):** If you attempt to run this without Docker (`npx ts-node src/index.ts`) on a Linux machine, you may encounter a `libnspr4.so missing` error. You must natively install Chrome's required shared libraries (e.g., via `apt-get install -y libnspr4 libnss3 ...`). Or simply use Docker.
