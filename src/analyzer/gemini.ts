import { GoogleGenAI, Type, Schema } from '@google/genai';
import { JobRaw, JobAnalyzed, AutomatableLevel } from '../types';
import { appendToJsonFile } from '../utils';

let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
}

const RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    job_category: {
      type: Type.STRING,
      description: "A short, standardized category name for this job (e.g., 'Frontend Developer', 'Data Engineer', 'HR Administrator')",
    },
    job_title: {
      type: Type.STRING,
      description: "The title of the job post",
    },
    automation_potential: {
      type: Type.STRING,
      enum: ["Low", "Medium", "High"],
      description: "Overall level of how much of the recurring job workflow can realistically be automated with current AI and software.",
    },
    automatable_tasks: {
      type: Type.ARRAY,
      items: {
        type: Type.STRING,
      },
      description: "A list of specific tasks or workflows from the job that can be automated or heavily assisted.",
    },
    implementation_complexity: {
      type: Type.STRING,
      enum: ["Low", "Medium", "High"],
      description: "Implementation difficulty of building and deploying a useful automation solution for this job.",
    },
    sale_potential: {
      type: Type.STRING,
      enum: ["Low", "Medium", "High"],
      description: "The potential to sell an automation solution for this job.",
    },
    confidence: {
      type: Type.STRING,
      enum: ["Low", "Medium", "High"],
      description: "Confidence in the assessment based on how clearly the job posting describes the actual work.",
    }
  },
  required: ["job_category", "job_title", "automation_potential", "automatable_tasks", "implementation_complexity", "sale_potential", "confidence"]
};

const SYSTEM_INSTRUCTION = `You are an expert AI automation strategist analyzing job descriptions.

Your task is to determine whether a significant portion of the job can be automated using current LLMs, AI agents, workflow automation, or traditional software.

Return only a JSON object that strictly matches the provided schema.
Do not include markdown, explanations, or extra fields.

Evaluation rules:
- Focus on the actual tasks described in the job posting, not assumptions about the profession.
- Distinguish between automating the entire job and automating parts of the workflow.
- Normalize job_category to a stable professional category label and avoid unnecessary synonyms.
- automation_potential should reflect how much of the recurring digital workflow can realistically be automated or heavily assisted today.
- automatable_tasks must contain specific tasks or workflows, not vague statements. Return an empty array if no meaningful tasks are automatable.
- implementation_complexity means implementation difficulty of building and deploying a useful automation solution for this job using current technology.
- sale_potential means commercial likelihood that employers would pay for such an automation solution, considering pain point intensity, ROI, and how common the role is.
- confidence means how confident you are in the assessment based on the clarity and completeness of the job posting.

Rating guidelines:
- automation_potential = Low: mostly physical, in-person, deeply human, or highly judgment-based work.
- automation_potential = Medium: several recurring tasks can be automated or heavily assisted, but human oversight remains important.
- automation_potential = High: a large share of core recurring tasks are digital, repetitive, structured, and realistic to automate today.

- implementation_complexity = Low: straightforward automation with common tools, structured inputs, and limited integrations.
- implementation_complexity = Medium: some AI uncertainty, integrations, or workflow redesign needed.
- implementation_complexity = High: difficult automation due to unstructured work, edge cases, regulation, or human oversight needs.

- sale_potential = Low: weak ROI, niche demand, or limited willingness to pay.
- sale_potential = Medium: useful for some employers, but not a strong urgent pain point.
- sale_potential = High: strong ROI, clear repeated pain point, and broad business demand.

- confidence = Low: job description is sparse or ambiguous.
- confidence = Medium: enough detail for a reasonable estimate, but some responsibilities are unclear.
- confidence = High: responsibilities are clearly described and the assessment is well supported.

Be concise, objective, and realistic.`;

export async function analyzeJobs(jobs: JobRaw[], outputFile: string, existingUrls: Set<string>): Promise<JobAnalyzed[]> {
  if (!ai) {
    throw new Error("Missing GEMINI_API_KEY environment variable. Please set it before analyzing.");
  }
  const analyzedJobs: JobAnalyzed[] = [];

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];

    if (existingUrls.has(job.url)) {
      console.log(`Skipping already analyzed job ${i + 1}/${jobs.length}: ${job.title}`);
      continue;
    }

    console.log(`Analyzing job ${i + 1}/${jobs.length}: ${job.title}`);

    const prompt = `Please analyze the following job description:\n\nTitle: ${job.title}\nCompany: ${job.company || 'Unknown'}\nDescription: ${job.description}`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: RESPONSE_SCHEMA,
          temperature: 0.2, // Low temperature for consistent formatting
        }
      });

      if (response.text) {
        const result = JSON.parse(response.text);

        const analyzedJob: JobAnalyzed = {
          ...job,
          job_category: result.job_category,
          automation_potential: result.automation_potential as AutomatableLevel,
          automatable_tasks: Array.isArray(result.automatable_tasks) ? result.automatable_tasks : [],
          implementation_complexity: result.implementation_complexity as AutomatableLevel,
          sale_potential: result.sale_potential as AutomatableLevel,
          confidence: result.confidence as AutomatableLevel,
        };

        analyzedJobs.push(analyzedJob);
        appendToJsonFile(outputFile, analyzedJob);
        console.log(`  Saved analyzed job ${i + 1}: ${job.title}`);
      }
    } catch (err) {
      console.error(`Failed to analyze job ${job.title}:`, err);
    }

    // Add a small delay between requests to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  return analyzedJobs;
}
