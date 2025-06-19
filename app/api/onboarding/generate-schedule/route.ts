import { NextRequest, NextResponse } from "next/server";
import { UserPreferences, Schedule } from "@/app/lib/types";

// Updated system prompt to handle adjustments and natural language commitments
const systemPrompt = `
You are an expert productivity assistant named "Atomic". Your role is to create a personalized, optimized daily schedule based on user preferences.

The user will provide their data in a JSON object. You MUST respond with ONLY a valid JSON object representing the generated schedule. Do not include any explanatory text, greetings, or markdown formatting like \`\`\`json. Your entire response must be the JSON object itself.

IMPORTANT: The user may provide commitments in two ways:
1. As structured "commitments" array (legacy format)
2. As "naturalLanguageCommitments" text describing their fixed activities in their own words

ADJUSTMENT HANDLING:
If the request includes "adjustmentRequest" and "previousSchedule", this means the user wants to modify an existing schedule:
- Apply the specific adjustment requested while maintaining all other preferences
- Keep all fixed commitments and important activities from the previous schedule
- Only modify what the user specifically requested to change
- Reorganize surrounding activities as needed to accommodate the change
- Maintain the overall structure and optimization of the original schedule

Examples of adjustment handling:
- "Change dinner from 8:45PM to 8:00PM" → Move dinner to 8:00PM, adjust activities around it
- "Move exercise to evening" → Relocate exercise block to evening hours, fill the gap appropriately
- "Add more break time" → Insert additional breaks while maintaining productivity

If naturalLanguageCommitments is provided, parse and interpret the natural language to understand:
- What the activity is
- When it happens (specific times, time ranges, or general periods like "morning")
- How long it takes
- How often it occurs (daily, weekdays, specific days, etc.)
- Any preferences or constraints mentioned

Examples of natural language parsing:
- "I go to the dog park daily for 1 hour at 5:30 PM" → Dog Park activity, 5:30 PM, 60 minutes, daily
- "Morning coffee and workout when I wake up, need at least 2 hours" → Coffee (30 min) + Workout (90 min) in morning
- "Team standup every weekday at 9 AM for 30 minutes" → Team Standup, 9:00 AM, 30 minutes, Monday-Friday

The JSON object you return must follow this exact structure:
{
  "timeSlots": [
    {
      "id": "a_unique_string_identifier",
      "time": "HH:MM",
      "activity": "Name of the activity",
      "description": "A brief description of the activity",
      "category": "Work | Goals | Personal Care | Meals | Commitment | Break | Travel",
      "duration": number, // in minutes
      "isCommitment": boolean
    }
  ],
  "summary": "A brief, encouraging summary of the generated schedule.",
  "optimizationReasoning": "A short explanation of why this schedule is optimal for the user, based on their preferences.",
  "confidence": number // a value between 0.0 and 1.0
}

When processing naturalLanguageCommitments:
- Mark parsed activities with "isCommitment": true and category: "Commitment"
- Be intelligent about time interpretation (e.g., "morning" = around wake-up time, "evening" = after work)
- If duration isn't specified, make reasonable estimates based on the activity type
- If frequency isn't clear, assume daily unless context suggests otherwise
- Handle flexible timing gracefully (e.g., "around 6 PM" can be scheduled at 6:00 PM)

Analyze the user's commitments, goals, sleep schedule, and work preferences to create a balanced and effective day.
- Respect all fixed commitments (both structured and natural language)
- Schedule deep focus work during the user's peak productivity hours
- Allocate time for personal goals
- Ensure there are breaks and meal times
- The schedule should flow logically from the user's wake-up time to their bedtime
`;

// Extended interface to handle adjustments
interface ScheduleGenerationRequest extends UserPreferences {
  adjustmentRequest?: string;
  previousSchedule?: Schedule;
}

export async function POST(req: NextRequest) {
	try {
		const requestData: ScheduleGenerationRequest = await req.json();

		// Create enhanced prompt for adjustments
		let userPrompt = `Here are my preferences, please generate my schedule: ${JSON.stringify(requestData)}`;

		if (requestData.adjustmentRequest && requestData.previousSchedule) {
			userPrompt = `
I have an existing schedule that I'd like to adjust. Here's the context:

PREVIOUS SCHEDULE:
${JSON.stringify(requestData.previousSchedule, null, 2)}

USER PREFERENCES:
${JSON.stringify({
  commitments: requestData.commitments,
  naturalLanguageCommitments: requestData.naturalLanguageCommitments,
  goals: requestData.goals,
  customGoals: requestData.customGoals,
  sleepSchedule: requestData.sleepSchedule,
  workPreferences: requestData.workPreferences,
  mealTimes: requestData.mealTimes
}, null, 2)}

ADJUSTMENT REQUEST:
"${requestData.adjustmentRequest}"

Please generate a new schedule that applies this specific adjustment while maintaining all my other preferences and commitments. Keep the overall structure and optimization, but make the requested change and reorganize surrounding activities as needed.
			`;
		}

		const response = await fetch("https://api.perplexity.ai/chat/completions", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
			},
			body: JSON.stringify({
				model: "sonar-pro",
				messages: [
					{ role: "system", content: systemPrompt },
					{
						role: "user",
						content: userPrompt,
					},
				],
				max_tokens: 4096,
				temperature: requestData.adjustmentRequest ? 0.3 : 0.7, // Lower temperature for adjustments to be more precise
			}),
		});

		if (!response.ok) {
			const errorBody = await response.text();
			console.error("Perplexity API Error:", errorBody);
			return NextResponse.json(
				{
					error: "Failed to generate schedule from Perplexity AI.",
					details: errorBody,
				},
				{ status: response.status }
			);
		}

		const data = await response.json();

		const content = data.choices[0]?.message?.content;

		if (!content) {
			return NextResponse.json(
				{ error: "Received an empty response from the AI." },
				{ status: 500 }
			);
		}

		let schedule: Schedule;
		try {
			schedule = JSON.parse(content);
		} catch (e) {
			console.error("Failed to parse AI response as JSON:", content);
			return NextResponse.json(
				{ error: "The AI returned an invalid format. Please try again." },
				{ status: 500 }
			);
		}

		// Validation step
		if (!schedule || !Array.isArray(schedule.timeSlots) || !schedule.summary) {
			console.error("Parsed content is not a valid Schedule object:", schedule);
			return NextResponse.json(
				{ error: "The AI failed to generate a valid schedule structure." },
				{ status: 500 }
			);
		}

		return NextResponse.json(schedule);
	} catch (error) {
		console.error("Error in generate-schedule route:", error);
		return NextResponse.json(
			{ error: "An internal server error occurred." },
			{ status: 500 }
		);
	}
}