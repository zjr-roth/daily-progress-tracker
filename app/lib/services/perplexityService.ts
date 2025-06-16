// app/lib/services/perplexityService.ts
import { Task, TimeBlock } from '../types';

interface UserInputs {
  constraints: string;
  goals: string;
  productivity: string;
  wakeTime: string;
  workStyle: string;
}

interface GeneratedTask {
  name: string;
  time: string;
  category: string;
  duration: number;
  block: TimeBlock;
  reasoning: string;
}

interface ScheduleResponse {
  tasks: GeneratedTask[];
  insights: string[];
  recommendations: string[];
}

interface OptimizationSuggestion {
  type: 'move' | 'add' | 'modify' | 'remove';
  task: string;
  newTime?: string;
  reasoning: string;
}

interface OptimizationResponse {
  suggestions: OptimizationSuggestion[];
  insights: string[];
}

interface ResearchResponse {
  practices: string[];
  timeAllocations: Record<string, number>;
  scientificBacking: string[];
}

export class PerplexityService {
  private static readonly API_BASE_URL = 'https://api.perplexity.ai/chat/completions';
  private static readonly API_KEY = process.env.PERPLEXITY_API_KEY;

  private static async makeAPICall(messages: any[], responseFormat?: any) {
    if (!this.API_KEY) {
      throw new Error('Perplexity API key not configured');
    }

    const requestBody: any = {
      model: 'llama-3.1-sonar-small-128k-online',
      messages,
      max_tokens: 2000,
      temperature: 0.2,
      top_p: 0.9,
      return_citations: true,
      search_domain_filter: ["pubmed.ncbi.nlm.nih.gov", "scholar.google.com", "harvard.edu", "stanford.edu"],
      search_recency_filter: "year"
    };

    if (responseFormat) {
      requestBody.response_format = responseFormat;
    }

    const response = await fetch(this.API_BASE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Perplexity API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  }

  static async generateOptimalSchedule(userInputs: UserInputs): Promise<ScheduleResponse> {
    const prompt = `You are an expert productivity consultant and schedule optimizer. Based on the following user information, create a personalized daily schedule:

**User Information:**
- Work/Study Constraints: ${userInputs.constraints}
- Life Goals & Priorities: ${userInputs.goals}
- Productivity Preferences: ${userInputs.productivity}
- Wake Time: ${userInputs.wakeTime}
- Work Style: ${userInputs.workStyle}

**Instructions:**
1. Research the latest productivity science and time management best practices
2. Create a detailed daily schedule with 8-12 tasks
3. Distribute tasks across morning (6 AM - 12 PM), afternoon (12 PM - 6 PM), and evening (6 PM - 11 PM) blocks
4. Include specific time slots (e.g., "8:00-9:30 AM")
5. Categorize tasks (Study, Work, Personal, Health, etc.)
6. Provide reasoning for each task placement based on research

**Required JSON Response Format:**
{
  "tasks": [
    {
      "name": "Task name",
      "time": "8:00-9:00 AM",
      "category": "Study",
      "duration": 60,
      "block": "morning",
      "reasoning": "Research-backed explanation for timing"
    }
  ],
  "insights": [
    "Key insight about the schedule based on research",
    "Another insight about productivity optimization"
  ],
  "recommendations": [
    "Specific recommendation for the user",
    "Another actionable recommendation"
  ]
}

Focus on evidence-based scheduling that aligns with the user's goals and constraints.`;

    try {
      const messages = [
        {
          role: 'system',
          content: 'You are an expert productivity consultant with access to the latest research on time management, circadian rhythms, and cognitive performance. Always provide evidence-based recommendations and cite relevant studies when possible.'
        },
        {
          role: 'user',
          content: prompt
        }
      ];

      const response = await this.makeAPICall(messages, {
        type: "json_object"
      });

      const content = response.choices[0].message.content;

      try {
        const parsed = JSON.parse(content);
        return this.validateAndProcessScheduleResponse(parsed);
      } catch (parseError) {
        console.error('Failed to parse Perplexity response:', content);
        throw new Error('Invalid response format from AI service');
      }
    } catch (error) {
      console.error('Error generating schedule:', error);
      throw new Error('Failed to generate optimal schedule. Please try again.');
    }
  }

  static async optimizeExistingSchedule(
    currentTasks: Task[],
    optimizationGoal: string
  ): Promise<OptimizationResponse> {
    const tasksDescription = currentTasks.map(task =>
      `${task.name} (${task.time}, ${task.duration}min, ${task.category})`
    ).join('\n');

    const prompt = `You are an expert schedule optimizer. Analyze the following existing schedule and provide optimization suggestions:

**Current Schedule:**
${tasksDescription}

**Optimization Goal:** ${optimizationGoal}

**Instructions:**
1. Research current best practices for schedule optimization
2. Analyze the schedule for improvements based on productivity science
3. Suggest specific changes (move, add, modify, or remove tasks)
4. Provide evidence-based reasoning for each suggestion

**Required JSON Response Format:**
{
  "suggestions": [
    {
      "type": "move",
      "task": "Task name",
      "newTime": "9:00-10:00 AM",
      "reasoning": "Research-backed explanation"
    }
  ],
  "insights": [
    "Key insight about current schedule efficiency",
    "Research-backed observation about improvements"
  ]
}`;

    try {
      const messages = [
        {
          role: 'system',
          content: 'You are an expert schedule optimization consultant with access to the latest research on productivity, time management, and cognitive performance optimization.'
        },
        {
          role: 'user',
          content: prompt
        }
      ];

      const response = await this.makeAPICall(messages, {
        type: "json_object"
      });

      const content = response.choices[0].message.content;
      return JSON.parse(content);
    } catch (error) {
      console.error('Error optimizing schedule:', error);
      throw new Error('Failed to optimize schedule. Please try again.');
    }
  }

  static async researchOptimalPractices(goals: string[]): Promise<ResearchResponse> {
    const goalsText = goals.join(', ');

    const prompt = `Research the latest scientific evidence and best practices for achieving these life goals: ${goalsText}

**Instructions:**
1. Find recent research (last 2 years preferred) on optimal practices for these goals
2. Determine evidence-based time allocations for related activities
3. Provide scientific backing with specific studies or principles

**Required JSON Response Format:**
{
  "practices": [
    "Specific evidence-based practice for goal achievement",
    "Another research-backed recommendation"
  ],
  "timeAllocations": {
    "Deep Work": 120,
    "Exercise": 60,
    "Learning": 90
  },
  "scientificBacking": [
    "Study or principle supporting the recommendations",
    "Research finding that backs the time allocations"
  ]
}`;

    try {
      const messages = [
        {
          role: 'system',
          content: 'You are a research expert specializing in productivity science, goal achievement, and evidence-based time management. Always cite recent studies and provide specific, actionable recommendations.'
        },
        {
          role: 'user',
          content: prompt
        }
      ];

      const response = await this.makeAPICall(messages, {
        type: "json_object"
      });

      const content = response.choices[0].message.content;
      return JSON.parse(content);
    } catch (error) {
      console.error('Error researching practices:', error);
      throw new Error('Failed to research optimal practices. Please try again.');
    }
  }

  private static validateAndProcessScheduleResponse(response: any): ScheduleResponse {
    if (!response.tasks || !Array.isArray(response.tasks)) {
      throw new Error('Invalid response: missing tasks array');
    }

    // Validate and process each task
    const processedTasks: GeneratedTask[] = response.tasks.map((task: any, index: number) => {
      if (!task.name || !task.time || !task.category || !task.duration || !task.block) {
        throw new Error(`Invalid task at index ${index}: missing required fields`);
      }

      // Validate time format
      if (!task.time.match(/\d{1,2}:\d{2}\s*(AM|PM)\s*-\s*\d{1,2}:\d{2}\s*(AM|PM)/i)) {
        throw new Error(`Invalid time format for task "${task.name}": ${task.time}`);
      }

      // Validate time block
      if (!['morning', 'afternoon', 'evening'].includes(task.block)) {
        throw new Error(`Invalid time block for task "${task.name}": ${task.block}`);
      }

      return {
        name: task.name,
        time: task.time,
        category: task.category,
        duration: Number(task.duration),
        block: task.block as TimeBlock,
        reasoning: task.reasoning || 'Optimized for productivity'
      };
    });

    return {
      tasks: processedTasks,
      insights: Array.isArray(response.insights) ? response.insights : [],
      recommendations: Array.isArray(response.recommendations) ? response.recommendations : []
    };
  }

  // Fallback method for when API is unavailable
  static async generateFallbackSchedule(userInputs: UserInputs): Promise<ScheduleResponse> {
    console.warn('Using fallback schedule generation');

    const tasks: GeneratedTask[] = [
      {
        name: "Morning Routine & Planning",
        time: "7:00-7:30 AM",
        category: "Personal",
        duration: 30,
        block: "morning",
        reasoning: "Starting the day with structure sets a positive tone"
      },
      {
        name: "Deep Work Session",
        time: "8:00-10:00 AM",
        category: "Study",
        duration: 120,
        block: "morning",
        reasoning: "Morning hours typically offer peak cognitive performance"
      },
      {
        name: "Break & Exercise",
        time: "10:00-10:30 AM",
        category: "Personal",
        duration: 30,
        block: "morning",
        reasoning: "Regular breaks maintain sustained productivity"
      },
      {
        name: "Focused Work",
        time: "1:00-2:30 PM",
        category: "Work",
        duration: 90,
        block: "afternoon",
        reasoning: "Post-lunch period good for structured tasks"
      },
      {
        name: "Review & Planning",
        time: "7:00-7:30 PM",
        category: "Personal",
        duration: 30,
        block: "evening",
        reasoning: "Evening reflection helps consolidate learning"
      }
    ];

    return {
      tasks,
      insights: [
        "This schedule follows research-backed productivity principles",
        "Peak cognitive hours are utilized for most demanding tasks",
        "Regular breaks are included to maintain energy levels"
      ],
      recommendations: [
        "Try this schedule for a week and adjust based on your energy levels",
        "Pay attention to when you feel most and least productive",
        "Consider your chronotype when fine-tuning task timing"
      ]
    };
  }
}