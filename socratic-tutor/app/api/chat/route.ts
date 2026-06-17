import Anthropic from "@anthropic-ai/sdk";
import {
  socratesSystemPrompt,
  summarySystemPrompt,
} from "@/lib/prompts";

const client = new Anthropic();

function formatDialogue(messages: Anthropic.MessageParam[]): string {
  return messages
    .map((message) => {
      const content =
        typeof message.content === "string"
          ? message.content
          : message.content
              .map((block) => ("text" in block ? block.text : ""))
              .join("");
      return `${message.role}: ${content}`;
    })
    .join("\n\n");
}

export async function POST(req: Request) {
  const { messages, document, theme, mode } = await req.json();

  const system =
    mode === "summary"
      ? summarySystemPrompt(formatDialogue(messages), theme)
      : socratesSystemPrompt(document, theme);

  const apiMessages =
    messages.length === 0 && mode !== "summary"
      ? [{ role: "user" as const, content: "Begin the session." }]
      : messages;

  const stream = client.messages.stream({
    model: "claude-opus-4-6",
    max_tokens: 1024,
    system,
    messages: apiMessages,
  });

  return new Response(stream.toReadableStream());
}
