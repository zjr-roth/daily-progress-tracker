// app/lib/services/perplexityService.ts - UPDATED FOR CURRENT API
import { Task, TimeBlock } from '../types';


// This is where all the problems mostly are. Way to many hardcoded items and not enough AI processing. THe AI should be able to stream the response and not have to wait for the entire response to be generated. The AI should be able to handle the conversation with the correct prompting. It should be working and if it is not the fallback message should just be "systems are down, please try again later.
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

// Updated to match current Perplexity API response format
interface PerplexityResponse {
  id: string;
  model: string;
  object: string;
  created_at: number;
  output: Array<{
    id: string;
    type: string;
    status: string;
    content: Array<{
      type: string;
      text: string;
      annotations?: any[];
    }>;
  }>;
  search_results?: Array<{
    title: string;
    url: string;
    date?: string;
  }>;
  usage: {
    input_tokens: number;
    output_tokens: number;
    reasoning_tokens?: number;
    search_queries?: number;
  };
}

export class PerplexityService {
  private static readonly API_BASE_URL = 'https://api.perplexity.ai/chat/completions';
  private static readonly API_KEY = process.env.PERPLEXITY_API_KEY;

  private static async makeAPICall(messages: any[], responseFormat?: any) {
    if (!this.API_KEY) {
      console.warn('Perplexity API key not configured, using fallback');
      throw new Error('API_NOT_CONFIGURED');
    }

    const requestBody: any = {
      model: 'sonar-pro', // Updated to current model
      messages,
      max_tokens: 2000,
      temperature: 0.2,
      top_p: 0.9,
      search_domain_filter: ["pubmed.ncbi.nlm.nih.gov", "scholar.google.com", "harvard.edu", "stanford.edu"],
      web_search_options: {
        search_context_size: "medium" // Updated parameter structure
      }
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
      const errorText = await response.text();
      console.error('Perplexity API error:', response.status, errorText);
      throw new Error(`API_ERROR: ${response.status}`);
    }

    const data: PerplexityResponse = await response.json();
    return data;
  }

  // Helper to extract content from new response format
  private static extractContent(response: PerplexityResponse): string {
    if (response.output && response.output.length > 0) {
      const firstOutput = response.output[0];
      if (firstOutput.content && firstOutput.content.length > 0) {
        return firstOutput.content[0].text;
      }
    }
    throw new Error('Invalid response format from Perplexity API');
  }

  // FIXED: Accept goals as string instead of array
  static async researchOptimalPractices(goals: string): Promise<ResearchResponse> {
    const prompt = `Research the latest scientific evidence and best practices for achieving these life goals: ${goals}

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

      const content = this.extractContent(response);
      return JSON.parse(content);
    } catch (error: any) {
      console.error('Error researching practices:', error);

      // Return fallback research results
      if (error.message === 'API_NOT_CONFIGURED' || error.message.includes('API_ERROR')) {
        return this.generateFallbackResearch(goals);
      }

      throw new Error('Failed to research optimal practices. Please try again.');
    }
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

      const content = this.extractContent(response);

      try {
        const parsed = JSON.parse(content);
        return this.validateAndProcessScheduleResponse(parsed);
      } catch (parseError) {
        console.error('Failed to parse Perplexity response:', content);
        throw new Error('Invalid response format from AI service');
      }
    } catch (error: any) {
      console.error('Error generating schedule:', error);

      // Use fallback if API fails
      if (error.message === 'API_NOT_CONFIGURED' || error.message.includes('API_ERROR')) {
        return this.generateFallbackSchedule(userInputs);
      }

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

      const content = this.extractContent(response);
      return JSON.parse(content);
    } catch (error: any) {
      console.error('Error optimizing schedule:', error);

      // Return fallback optimization
      if (error.message === 'API_NOT_CONFIGURED' || error.message.includes('API_ERROR')) {
        return this.generateFallbackOptimization(currentTasks, optimizationGoal);
      }

      throw new Error('Failed to optimize schedule. Please try again.');
    }
  }

  // FIXED: Generate fallback research for when API is unavailable
  private static generateFallbackResearch(goals: string): ResearchResponse {
    console.log('Using fallback research for goals:', goals);

    const goalLower = goals.toLowerCase();
    const practices: string[] = [];
    const timeAllocations: Record<string, number> = {};
    const scientificBacking: string[] = [];

    // Analyze goals and provide relevant practices
    if (goalLower.includes('fintech') || goalLower.includes('entrepreneur') || goalLower.includes('business')) {
      practices.push(
        'Focus on deep work sessions during peak cognitive hours (typically 9-11 AM)',
        'Dedicate specific time blocks for networking and industry learning',
        'Implement the 80/20 rule: focus 80% of time on high-impact activities'
      );
      timeAllocations['Strategic Planning'] = 60;
      timeAllocations['Industry Research'] = 90;
      timeAllocations['Networking'] = 45;
      scientificBacking.push(
        'Research shows peak cognitive performance occurs 2-4 hours after waking',
        'The Pareto Principle (80/20 rule) is validated across multiple productivity studies'
      );
    }

    if (goalLower.includes('study') || goalLower.includes('cpa') || goalLower.includes('math') || goalLower.includes('programming')) {
      practices.push(
        'Use the Pomodoro Technique: 25-minute focused sessions with 5-minute breaks',
        'Schedule the most challenging subjects during morning hours',
        'Implement spaced repetition for long-term retention'
      );
      timeAllocations['Deep Study'] = 120;
      timeAllocations['Practice Problems'] = 90;
      timeAllocations['Review & Reflection'] = 30;
      scientificBacking.push(
        'Cognitive Load Theory suggests breaking complex learning into manageable chunks',
        'Circadian rhythm research shows optimal learning occurs during morning hours'
      );
    }

    if (goalLower.includes('fitness') || goalLower.includes('health') || goalLower.includes('exercise')) {
      practices.push(
        'Schedule exercise at consistent times to build habit patterns',
        'Include both cardiovascular and strength training for optimal health',
        'Plan recovery time between intense workout sessions'
      );
      timeAllocations['Exercise'] = 60;
      timeAllocations['Meal Planning'] = 30;
      timeAllocations['Recovery/Stretching'] = 20;
      scientificBacking.push(
        'Habit formation research shows consistency of timing increases adherence',
        'Exercise physiology research supports varied training modalities'
      );
    }

    // Add general productivity practices if no specific goals detected
    if (practices.length === 0) {
      practices.push(
        'Implement time-blocking to create structure and reduce decision fatigue',
        'Use the two-minute rule: do tasks immediately if they take less than 2 minutes',
        'Schedule regular breaks to maintain cognitive performance throughout the day'
      );
      timeAllocations['Focused Work'] = 120;
      timeAllocations['Administrative Tasks'] = 45;
      timeAllocations['Planning & Review'] = 30;
      scientificBacking.push(
        'Time-blocking reduces cognitive switching costs and improves focus',
        'Regular breaks prevent cognitive fatigue and maintain performance'
      );
    }

    return {
      practices: practices.slice(0, 5), // Limit to 5 practices
      timeAllocations,
      scientificBacking: scientificBacking.slice(0, 3) // Limit to 3 backing statements
    };
  }

  private static generateFallbackOptimization(
    currentTasks: Task[],
    optimizationGoal: string
  ): OptimizationResponse {
    const suggestions: OptimizationSuggestion[] = [];
    const insights: string[] = [];

    // Analyze current schedule for basic optimization opportunities
    const morningTasks = currentTasks.filter(t => t.block === 'morning');
    const afternoonTasks = currentTasks.filter(t => t.block === 'afternoon');
    const eveningTasks = currentTasks.filter(t => t.block === 'evening');

    // Check for schedule balance
    if (morningTasks.length < 2 && afternoonTasks.length > 4) {
      suggestions.push({
        type: 'move',
        task: afternoonTasks[0].name,
        newTime: '9:00-10:00 AM',
        reasoning: 'Moving tasks to morning hours can leverage peak cognitive performance'
      });
    }

    // Check for missing breaks
    const totalDuration = currentTasks.reduce((sum, task) => sum + task.duration, 0);
    if (totalDuration > 360 && !currentTasks.some(task => task.name.toLowerCase().includes('break'))) {
      suggestions.push({
        type: 'add',
        task: 'Mid-day Break',
        newTime: '2:30-2:45 PM',
        reasoning: 'Regular breaks prevent cognitive fatigue and maintain productivity'
      });
    }

    // Add insights based on analysis
    insights.push(`Current schedule utilization: ${Math.round((totalDuration / 900) * 100)}%`);
    insights.push(`Morning block has ${morningTasks.length} tasks - optimal for focused work`);

    if (suggestions.length === 0) {
      insights.push('Your schedule appears well-balanced with good time distribution');
    }

    return { suggestions, insights };
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

  // Enhanced fallback method for when API is unavailable
  static async generateFallbackSchedule(userInputs: UserInputs): Promise<ScheduleResponse> {
    console.warn('Using enhanced fallback schedule generation');

    const profile = userInputs;
    const baseTasks: Omit<GeneratedTask, 'reasoning'>[] = [];

    // Determine wake time and adjust schedule accordingly
    const wakeTimeHour = this.parseWakeTime(profile.wakeTime);
    const scheduleStart = Math.max(wakeTimeHour, 6); // Don't start before 6 AM

    // Morning routine (always included)
    baseTasks.push({
      name: "Morning Routine & Planning",
      time: `${scheduleStart}:00-${scheduleStart}:30 AM`,
      category: "Personal",
      duration: 30,
      block: "morning",
    });

    // Analyze goals to determine task priorities
    const goals = profile.goals.toLowerCase();
    const constraints = profile.constraints.toLowerCase();

    // Work/Study blocks based on constraints
    if (constraints.includes('9') && constraints.includes('5')) {
      baseTasks.push(
        {
          name: "Deep Work Session 1",
          time: "9:00-11:00 AM",
          category: "Work",
          duration: 120,
          block: "morning",
        },
        {
          name: "Administrative Tasks",
          time: "11:00-11:30 AM",
          category: "Work",
          duration: 30,
          block: "morning",
        },
        {
          name: "Project Work",
          time: "1:00-3:00 PM",
          category: "Work",
          duration: 120,
          block: "afternoon",
        }
      );
    } else if (constraints.includes('student') || goals.includes('study')) {
      baseTasks.push(
        {
          name: "Primary Study Session",
          time: `${scheduleStart + 1}:00-${scheduleStart + 3}:00 AM`,
          category: "Study",
          duration: 120,
          block: "morning",
        },
        {
          name: "Practice & Review",
          time: "2:00-3:30 PM",
          category: "Study",
          duration: 90,
          block: "afternoon",
        }
      );
    }

    // Add goal-specific tasks
    if (goals.includes('fintech') || goals.includes('entrepreneur')) {
      baseTasks.push({
        name: "Industry Research & Market Analysis",
        time: "3:30-5:00 PM",
        category: "Research",
        duration: 90,
        block: "afternoon",
      });
    }

    if (goals.includes('health') || goals.includes('fitness') || goals.includes('exercise')) {
      baseTasks.push({
        name: "Exercise & Fitness",
        time: "6:00-7:00 PM",
        category: "Personal",
        duration: 60,
        block: "evening",
      });
    }

    if (goals.includes('programming') || goals.includes('coding')) {
      baseTasks.push({
        name: "Programming & Development",
        time: "7:30-9:00 PM",
        category: "Study",
        duration: 90,
        block: "evening",
      });
    }

    // Add work style based tasks
    if (profile.workStyle.toLowerCase().includes('break')) {
      baseTasks.push(
        {
          name: "Mid-Morning Break",
          time: "10:30-10:45 AM",
          category: "Personal",
          duration: 15,
          block: "morning",
        },
        {
          name: "Afternoon Break",
          time: "3:30-3:45 PM",
          category: "Personal",
          duration: 15,
          block: "afternoon",
        }
      );
    }

    // Essential tasks
    baseTasks.push(
      {
        name: "Lunch & Recharge",
        time: "12:00-1:00 PM",
        category: "Personal",
        duration: 60,
        block: "afternoon",
      },
      {
        name: "Evening Planning & Reflection",
        time: "9:00-9:30 PM",
        category: "Personal",
        duration: 30,
        block: "evening",
      }
    );

    // Convert to full tasks with reasoning
    const tasks: GeneratedTask[] = baseTasks.map((task, index) => ({
      ...task,
      reasoning: this.generateTaskReasoning(task, profile)
    }));

    const insights = [
      `Schedule optimized for ${profile.wakeTime} wake time`,
      `Focused on your primary goals: ${profile.goals}`,
      `Adapted to your work constraints: ${profile.constraints}`,
      `Designed around your work style preferences`,
      `Includes ${tasks.length} strategically placed tasks across all time blocks`
    ];

    const recommendations = [
      "Try this schedule for one week and track your energy levels",
      "Adjust task timing based on when you feel most productive",
      "Use the customization tools to fine-tune specific tasks",
      "Consider the 2-minute rule for small tasks throughout the day",
      "Remember that consistency is more important than perfection"
    ];

    return { tasks, insights, recommendations };
  }

  private static parseWakeTime(wakeTimeString: string): number {
    const match = wakeTimeString.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i);
    if (!match) return 7; // Default to 7 AM

    let hour = parseInt(match[1]);
    const period = match[3]?.toUpperCase();

    if (period === 'PM' && hour !== 12) {
      hour += 12;
    } else if (period === 'AM' && hour === 12) {
      hour = 0;
    }

    return Math.max(5, Math.min(10, hour)); // Clamp between 5 AM and 10 AM
  }

  private static generateTaskReasoning(task: Omit<GeneratedTask, 'reasoning'>, profile: UserInputs): string {
    const taskName = task.name.toLowerCase();
    const block = task.block;
    const goals = profile.goals.toLowerCase();

    if (taskName.includes('morning routine')) {
      return 'Starting the day with structure and planning sets a positive foundation for productivity';
    }

    if (taskName.includes('deep work') || taskName.includes('study')) {
      if (block === 'morning') {
        return 'Morning hours typically offer peak cognitive performance and minimal distractions';
      }
      return 'Focused work sessions are essential for meaningful progress on complex tasks';
    }

    if (taskName.includes('exercise') || taskName.includes('fitness')) {
      return 'Regular physical activity improves cognitive function and provides stress relief';
    }

    if (taskName.includes('break')) {
      return 'Strategic breaks prevent cognitive fatigue and maintain sustained productivity';
    }

    if (taskName.includes('research') && goals.includes('fintech')) {
      return 'Industry knowledge is crucial for success in the competitive fintech landscape';
    }

    if (taskName.includes('planning') || taskName.includes('reflection')) {
      return 'Daily reflection and planning helps consolidate learning and prepare for tomorrow';
    }

    return 'This task is strategically placed to optimize your daily productivity flow';
  }
}