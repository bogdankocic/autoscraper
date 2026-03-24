export interface JobRaw {
  url: string;
  source: 'infostud' | 'helloworld';
  category_url: string;
  title: string;
  company?: string;
  description: string;
}

export type AutomatableLevel = 'Low' | 'Medium' | 'High';

export interface JobAnalyzed extends JobRaw {
  job_category: string;
  automation_potential: AutomatableLevel;
  automatable_tasks: string[];
  implementation_complexity: AutomatableLevel;
  sale_potential: AutomatableLevel;
  confidence: AutomatableLevel;
}
