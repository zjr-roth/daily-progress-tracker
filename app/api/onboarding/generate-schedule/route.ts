import { NextRequest, NextResponse } from "next/server";
import { UserPreferences, Schedule } from "@/app/lib/types";

// The system prompt is crucial for instructing the AI on its role and the expected output format.
const systemPrompt = `
You are an expert productivity assistant named "Atomic". Your role is to create a personalized, optimized daily schedule based on user preferences.

The user will provide their data in a JSON object. You MUST respond with ONLY a valid JSON object representing the generated schedule. Do not include any explanatory text, greetings, or markdown formatting like \`\`\`json. Your entire response must be the JSON object itself.

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

Analyze the user's commitments, goals, sleep schedule, and work preferences to create a balanced and effective day.
- Respect all fixed commitments.
- Schedule deep focus work during the user's peak productivity hours.
- Allocate time for personal goals.
- Ensure there are breaks and meal times.
- The schedule should flow logically from the user's wake-up time to their bedtime.
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

		// TESTS:
		/* console.log("data", data); */


		const content = data.choices[0]?.message?.content;

		// TESTS:
		/* console.log("--- RAW AI RESPONSE CONTENT ---");
        console.log(content);
        console.log("-----------------------------"); */

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

		// **NEW VALIDATION STEP**
		// Ensure the parsed object looks like a schedule before returning
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