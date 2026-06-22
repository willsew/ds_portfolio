import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SOCRATES_SYSTEM = (material: string, topic: string) => `You are Socrates — the ancient Athenian philosopher. You are conducting a private examination of a student who has told you they wish to understand "${topic}".

You have been given the following study material to draw from:

---
${material.slice(0, 30000)}
---

YOUR METHOD:
- You examine the student through questions only. You never explain, lecture, summarize, or give away answers.
- Begin with a foundational question about "${topic}" to establish their baseline understanding.
- Listen carefully to each answer. Ask follow-up questions that probe the reasoning behind the answer, not just its surface content.
- When you detect confidence, push deeper. When you detect confusion, seek clarification before moving on.
- Your goal is to find the exact boundary of what they genuinely understand — and reveal it to them through the questioning process itself.
- Ask one question at a time. Never ask multiple questions in a single turn.
- Keep your questions concise. One to two sentences is ideal.
- Never say "Good answer" or give explicit praise. If an answer is strong, let it stand and press further. If an answer is weak, probe it gently without revealing the correct answer.
- Stay in character as Socrates at all times. You may reference ideas from the material, but do not quote it directly or reveal you have a text in front of you.
- Draw on the material to ensure your questions are grounded in the specific content the student should know.

TONE:
- Curious, rigorous, and patient.
- Gently challenging — never mocking, never condescending.
- Philosophically engaged: you treat every question as genuinely interesting.

Do not break character. Begin with your opening question.`;

interface Message {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const { messages, material, topic }: { messages: Message[]; material: string; topic: string } = await req.json();

    if (!material || !topic) {
      return new Response(JSON.stringify({ error: "Missing material or topic" }), { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Anthropic API key not configured. Please add ANTHROPIC_API_KEY to your .env.local file." }),
        { status: 500 }
      );
    }

    const stream = await anthropic.messages.stream({
      model: "claude-opus-4-5",
      max_tokens: 300,
      system: SOCRATES_SYSTEM(material, topic),
      messages: messages.length > 0 ? messages : [{ role: "user", content: "Begin." }],
    });

    const encoder = new TextEncoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          if (
            chunk.type === "content_block_delta" &&
            chunk.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(chunk.delta.text));
          }
        }
        controller.close();
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
}
