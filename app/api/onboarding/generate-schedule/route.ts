import { NextRequest, NextResponse } from "next/server";
import { UserPreferences, Schedule } from "@/app/lib/types";

// Updated system prompt to handle natural language commitments
const systemPrompt = `
You are an expert productivity assistant named "Atomic". Your role is to create a personalized, optimized daily schedule based on user preferences.

The user will provide their data in a JSON object. You MUST respond with ONLY a valid JSON object representing the generated schedule. Do not include any explanatory text, greetings, or markdown formatting like \`\`\`json. Your entire response must be the JSON object itself.

IMPORTANT: The user may provide commitments in two ways:
1. As structured "commitments" array (legacy format)
2. As "naturalLanguageCommitments" text describing their fixed activities in their own words

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

export async function POST(req: NextRequest) {
	try {
		const userData: UserPreferences = await req.json();

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
						content: `Here are my preferences, please generate my schedule: ${JSON.stringify(
							userData
						)}`,
					},
				],
				max_tokens: 4096,
				temperature: 0.7,
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