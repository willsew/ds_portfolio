import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface QuestionFeedback {
  question: string;
  answer: string;
  feedback: string;
  strength: "strong" | "partial" | "gap";
}

interface SummaryResponse {
  understood: string[];
  revisit: string[];
  questionFeedback: QuestionFeedback[];
  overallAssessment: string;
}

const SUMMARY_PROMPT = (material: string, topic: string, conversation: string) => `You evaluated a student's understanding of "${topic}" through a Socratic dialogue. Below is the full conversation, followed by the study material they were tested against.

CONVERSATION:
${conversation}

STUDY MATERIAL (excerpt):
${material.slice(0, 15000)}

Now produce a structured assessment in the following JSON format exactly:

{
  "understood": [
    "A specific concept or idea the student demonstrated genuine understanding of",
    "..."
  ],
  "revisit": [
    "A specific concept or idea the student struggled with or showed gaps in",
    "..."
  ],
  "questionFeedback": [
    {
      "question": "The exact question Socrates asked",
      "answer": "A brief summary of what the student said",
      "feedback": "Honest, constructive feedback on this specific answer — what was right, what was incomplete, what was missing",
      "strength": "strong | partial | gap"
    }
  ],
  "overallAssessment": "2-3 sentences honestly summarizing where the student stands in their understanding of ${topic}. Be direct and specific."
}

Rules:
- Include 2–6 items in "understood" and "revisit"
- Include one entry in questionFeedback for EACH question Socrates asked (not counting the student's messages)
- Be specific. Reference actual content from the conversation and the material.
- "strong" means the student answered well. "partial" means partially correct or incomplete. "gap" means a significant misunderstanding or inability to answer.
- Return only valid JSON — no markdown, no code fences, no commentary outside the JSON.`;

export async function POST(req: NextRequest) {
  try {
    const { messages, material, topic }: { messages: Message[]; material: string; topic: string } = await req.json();

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "Anthropic API key not configured." }, { status: 500 });
    }

    const conversation = messages
      .map((m) => `${m.role === "assistant" ? "Socrates" : "Student"}: ${m.content}`)
      .join("\n\n");

    const response = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 2000,
      messages: [
        {
          role: "user",
          content: SUMMARY_PROMPT(material, topic, conversation),
        },
      ],
    });

    const raw = response.content[0].type === "text" ? response.content[0].text : "{}";

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const summary: SummaryResponse = JSON.parse(jsonMatch ? jsonMatch[0] : raw);

    return NextResponse.json(summary);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
