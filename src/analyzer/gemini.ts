import { GoogleGenAI, Type, Schema } from '@google/genai';
import { JobRaw, JobAnalyzed, AutomatableLevel } from '../types';

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
    is_automatable: {
      type: Type.BOOLEAN,
      description: "True if this job has high potential to be mostly automated by AI/software, False otherwise",
    },
    what_is_automatable: {
      type: Type.STRING,
      description: "A concise 1-sentence description of exactly what aspects of this job are automatable. Write 'None.' if not automatable.",
    },
    complexity: {
      type: Type.STRING,
      enum: ["Low", "Medium", "High"],
      description: "The complexity of automating this job.",
    },
    sale_potential: {
      type: Type.STRING,
      enum: ["Low", "Medium", "High"],
      description: "The potential to sell an automation solution for this job.",
    }
  },
  required: ["job_category", "job_title", "is_automatable", "what_is_automatable", "complexity", "sale_potential"]
};

const SYSTEM_INSTRUCTION = `You are an expert AI implementation strategist. 
Your goal is to look at job descriptions and determine how much of the work can be automated using LLMs, AI agents, or traditional software automation.
Evaluate the given job description and output a JSON object strictly matching the schema parameters provided.
Be objective and realistic - jobs requiring extreme physical presence or deep human empathy are low automation, whereas repetitive data processing, coding tasks, and customer support are medium to high.`;

export async function analyzeJobs(jobs: JobRaw[]): Promise<JobAnalyzed[]> {
  if (!ai) {
    throw new Error("Missing GEMINI_API_KEY environment variable. Please set it before analyzing.");
  }
  const analyzedJobs: JobAnalyzed[] = [];

  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    console.log(`Analyzing job ${i + 1}/${jobs.length}: ${job.title}`);

    const prompt = `Please analyze the following job description:\n\nTitle: ${job.title}\nCompany: ${job.company || 'Unknown'}\nDescription: ${job.description}`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
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
        
        analyzedJobs.push({
          ...job,
          job_category: result.job_category,
          is_automatable: result.is_automatable,
          what_is_automatable: result.what_is_automatable,
          complexity: result.complexity as AutomatableLevel,
          sale_potential: result.sale_potential as AutomatableLevel,
        });
      }
    } catch (err) {
      console.error(`Failed to analyze job ${job.title}:`, err);
    }
    
    // Add a small delay between requests to avoid rate limits
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  return analyzedJobs;
}
